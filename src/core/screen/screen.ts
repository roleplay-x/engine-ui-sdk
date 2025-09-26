import {
  EngineClient,
  Locale,
  ServerTemplateConfigType,
  ServerTemplateConfiguration,
  TemplateCategory,
} from '@roleplayx/engine-sdk';

import { createEngineClient, createGamemodeClient, SessionContext } from '../context/context';
import { GamemodeClient } from '../../gamemode/client';
import { ShellBridge } from '../shell/shell-bridge';
import { EventListener, UIEventEmitter } from '../events/event-emitter';
import { ShellEvents, ShellInitializeScreen } from '../shell/events/shell-events';
import { UIEvents } from '../shell/events/ui-events';
import { Toast } from '../../screens/toaster/screen';
import { ServerConfiguration } from '../server/server-configuration';

import { ScreenEvents } from './events/events';
import { ScreenType } from './screen-type';
import { TemplateLocalizationSettings, TemplateTextLocalization } from './template-localization';
import {
  TemplateConfig,
  TemplateConfiguration,
  TemplateConfigurationSettings,
} from './template-configuration';
import { ScreenNotification } from './screen-notification';

export interface ScreenSettings<
  TLocalization extends TemplateTextLocalization,
  TTemplateConfiguration extends TemplateConfiguration,
> {
  localization: TemplateLocalizationSettings<TLocalization, TTemplateConfiguration>;
  configuration: TemplateConfigurationSettings<TTemplateConfiguration>;
}

export abstract class Screen<
  TEvents extends ScreenEvents,
  TLocalization extends TemplateTextLocalization,
  TTemplateConfiguration extends TemplateConfiguration,
> {
  private readonly shellBridge: ShellBridge;
  private readonly eventEmitter: UIEventEmitter<TEvents>;

  private _engineClient: EngineClient | undefined;
  private _gamemodeClient: GamemodeClient | undefined;
  private _context: SessionContext | undefined;
  private _localization: TLocalization | undefined;
  private _templateConfiguration: TTemplateConfiguration | undefined;
  private _serverConfiguration: ServerConfiguration | undefined;
  private _locales: Locale[] | undefined;
  private _defaultLocale: string | undefined;

  protected constructor(
    protected readonly screen: ScreenType,
    private readonly defaultSettings: ScreenSettings<TLocalization, TTemplateConfiguration>,
  ) {
    this.shellBridge = new ShellBridge(screen);
    this.eventEmitter = new UIEventEmitter<TEvents>();
  }

  public readyToInitialize() {
    this.onShell('shell:initializeScreen', async (init: ShellInitializeScreen) => {
      await this.setup(init);
    });

    this.onShell('shell:localeChanged', ({ locale, localization }) => {
      return this.onLocaleChanged({ locale, localization });
    });

    this.onShell('shell:notification', (notification) => {
      return this.onNotification(notification);
    });

    this.emitToShell('screen:readyToInitialize', {
      screen: this.screen,
    });
  }

  public initialized() {
    if (!this._context) {
      throw new Error('Screen is not initialized');
    }

    this.emitToShell('screen:initialized', {
      screen: ScreenType.Login,
      templateId: this._context.templateId,
    });
  }

  public on<E extends keyof TEvents>(event: E, listener: EventListener<TEvents[E]>): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  public off<E extends keyof TEvents>(event: E, listener?: EventListener<TEvents[E]>): this {
    this.eventEmitter.off(event, listener);
    return this;
  }

  public toast(notification: Toast) {
    this.shellBridge.emitToShell('screen:notifyScreen', {
      screen: TemplateCategory.Toaster,
      type: 'toast',
      data: notification,
    });
  }

  public get localization(): TLocalization {
    if (!this._localization) {
      throw new Error('Screen is not initialized');
    }
    return this._localization;
  }

  public get templateConfiguration(): TTemplateConfiguration {
    if (!this._templateConfiguration) {
      throw new Error('Screen is not initialized');
    }
    return this._templateConfiguration;
  }

  public get serverConfiguration(): ServerConfiguration {
    if (!this._serverConfiguration) {
      throw new Error('Screen is not initialized');
    }
    return this._serverConfiguration;
  }

  public get defaultLocale(): string {
    if (!this._defaultLocale) {
      throw new Error('Screen is not initialized');
    }
    return this._defaultLocale;
  }

  public get locales(): Locale[] {
    if (!this._locales) {
      throw new Error('Screen is not initialized');
    }
    return this._locales;
  }

  protected emit<E extends keyof TEvents>(event: E, payload: TEvents[E]): boolean {
    return this.eventEmitter.emit(event, payload);
  }

  public formatMessage = (key: keyof TLocalization, params?: Record<string, string>): string => {
    const localization = this.localization[key];
    if (!localization) return key as string;

    let message = localization.message;
    if (params) {
      Object.keys(params).forEach((key: string) => {
        message = message.replace(`\${${key}}`, params[key]);
      });
    }

    return message;
  };

  protected get engineClient(): EngineClient {
    if (!this._engineClient) {
      throw new Error('Screen is not initialized');
    }
    return this._engineClient;
  }

  protected get gamemodeClient(): GamemodeClient {
    if (!this._gamemodeClient) {
      throw new Error('Screen is not initialized');
    }
    return this._gamemodeClient;
  }

  protected get context(): SessionContext {
    if (!this._context) {
      throw new Error('Screen is not initialized');
    }
    return this._context;
  }

  protected async onInit(): Promise<void> {
    this.eventEmitter.emit('init', { screen: this.screen });
  }

  protected async onLocaleChanged({
    locale,
    localization,
  }: {
    locale: string;
    localization: TemplateTextLocalization;
  }): Promise<void> {
    this._gamemodeClient?.changeLocale(locale);
    this._engineClient?.changeLocale(locale);
    this._localization = this.mapTemplateLocalization(localization as TLocalization);
    this.eventEmitter.emit('localeChanged', { locale, localization: this._localization });
  }

  protected changeLocale(locale: string) {
    this.shellBridge.emitToShell('screen:changeLocale', { fromScreen: this.screen, locale });
  }

  protected emitError(error: string, details?: unknown) {
    this.shellBridge.emitToShell('screen:error', { error, details });
  }

  protected navigateToScreen(toScreen: ScreenType, params?: unknown) {
    this.shellBridge.emitToShell('screen:navigation', {
      fromScreen: this.screen,
      toScreen,
      params,
    });
  }

  protected onShell<E extends keyof ShellEvents>(
    event: E,
    listener: (payload: ShellEvents[E]) => void,
  ) {
    this.shellBridge.onShellEvent(event, listener);
  }

  protected offShell<E extends keyof ShellEvents>(
    event: E,
    listener?: (payload: ShellEvents[E]) => void,
  ) {
    this.shellBridge.offShellEvent(event, listener);
  }

  protected emitToShell<E extends keyof UIEvents>(event: E, payload: UIEvents[E]) {
    return this.shellBridge.emitToShell(event, payload);
  }

  private async setup(init: ShellInitializeScreen) {
    this._context = init.context;
    this._engineClient = createEngineClient(init.context, this.screen);
    this._gamemodeClient = createGamemodeClient(init.context);
    this._localization = this.mapTemplateLocalization(init.localization as TLocalization);
    this._serverConfiguration = init.serverConfiguration;
    this._locales = init.locales;
    this._defaultLocale = init.defaultLocale;
    this._templateConfiguration = this.mapTemplateConfiguration(init.templateConfiguration);
    await this.onInit();
  }

  private onNotification(notification: ScreenNotification) {
    if (notification.screen !== this.screen) {
      return;
    }

    this.emit(notification.type as keyof TEvents, notification.data as TEvents[keyof TEvents]);
  }

  private mapTemplateConfiguration(configuration: Array<ServerTemplateConfiguration>) {
    let templateConfiguration = configuration.reduce((acc, config) => {
      acc[config.templateKey] = {
        type: config.type,
        value: config.value,
      } as TemplateConfig<ServerTemplateConfigType>;
      return acc;
    }, {} as TemplateConfiguration) as TTemplateConfiguration;

    templateConfiguration = {
      ...templateConfiguration,
      ...(Object.keys(this.defaultSettings.configuration)
        .filter((key) => !templateConfiguration[key])
        .reduce((acc, key) => {
          const config = this.defaultSettings.configuration[key];
          acc[key] = {
            type: config.type,
            value: config.value,
          } as TemplateConfig<ServerTemplateConfigType>;
          return acc;
        }, {} as TemplateConfiguration) as TTemplateConfiguration),
    };
    return templateConfiguration;
  }

  private mapTemplateLocalization(localization: TLocalization): TLocalization {
    let templateLocalization = localization;
    if (!this.defaultSettings.localization[this.context.locale]) {
      return templateLocalization;
    }
    templateLocalization = {
      ...templateLocalization,
      ...(Object.keys(this.defaultSettings.localization[this.context.locale].TEXTS)
        .filter((key) => !templateLocalization[key])
        .reduce((acc, key) => {
          acc[key] = this.defaultSettings.localization[this.context.locale].TEXTS[key];
          return acc;
        }, {} as TemplateTextLocalization) as TLocalization),
    };
    return templateLocalization;
  }
}
