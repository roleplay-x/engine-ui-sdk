import { EngineClient, PublicApi, PublicConfig } from '@roleplayx/engine-sdk';

import { ShellInitializeScreen } from '../core/shell/events/shell-events';
import { ScreenType } from '../core/screen/screen-type';
import { ServerConfiguration } from '../core/server/server-configuration';
import { ScreenCallback, ScreenDataPayload, ScreenMode } from '../core/screen/screen';
import { ScreenNotification } from '../core/screen/screen-notification';

export interface LocalShellSettings {
  templateId: string;
  engineApiUrl: string;
  gamemodeApiUrl: string;
  serverId: string;
}

export interface LocalShellInitializeScreen {
  screen: ScreenType;
  sessionId: string;
  sessionToken: string;
  locale?: string;
  mode?: ScreenMode;
  data?: ScreenDataPayload;
  callback?: ScreenCallback;
}

export class LocalShell {
  constructor(private settings: LocalShellSettings) {
    window.addEventListener('message', this.onMessage.bind(this));
  }

  private onMessage(event: MessageEvent) {
    const { type, payload } = event.data;
    switch (type) {
      case 'localShell:initializeScreen':
        return this.handleLocalShellInitialize(payload);
      case 'localShell:notification':
        return this.handleLocalShellNotifyScreen(payload);
    }
  }

  private async handleLocalShellInitialize({
    screen,
    locale,
    sessionId,
    sessionToken,
    mode,
    data,
    callback,
  }: LocalShellInitializeScreen) {
    const engineClient = new EngineClient({
      locale: locale ?? 'en-US',
      serverId: this.settings.serverId,
      apiUrl: this.settings.engineApiUrl,
      applicationName: 'local-shell',
    });

    const publicApi = new PublicApi(engineClient);
    const serverConfiguration = this.mapServerConfiguration(await publicApi.getConfiguration());
    const locales = await publicApi.getLocales();

    const payload: ShellInitializeScreen = {
      screen,
      context: {
        locale: locale ?? 'en-US',
        templateId: this.settings.templateId,
        engineApiUrl: this.settings.engineApiUrl,
        gamemodeApiUrl: this.settings.gamemodeApiUrl,
        serverId: this.settings.serverId,
        sessionId,
        sessionToken,
      },
      serverConfiguration,
      serverLocalization: await publicApi.getLocalization(),
      locale: locale ?? 'en-US',
      defaultLocale: serverConfiguration.DEFAULT_LANGUAGE?.value?.key ?? 'en-US',
      locales,
      mode: mode ?? 'SCREEN',
      data,
      callback,
    };

    const customEvent = new CustomEvent('shell:initializeScreen', {
      detail: payload,
      bubbles: true,
      composed: true,
    });

    window.dispatchEvent(customEvent);
  }

  private async handleLocalShellNotifyScreen(notification: ScreenNotification) {
    const customEvent = new CustomEvent('shell:notification', {
      detail: notification,
      bubbles: true,
      composed: true,
    });

    window.dispatchEvent(customEvent);
  }

  mapServerConfiguration(publicConfigs: ReadonlyArray<PublicConfig>): ServerConfiguration {
    return publicConfigs.reduce((acc, publicConfig) => {
      return {
        ...acc,
        [publicConfig.key]: publicConfig,
      };
    }, {} as ServerConfiguration);
  }
}
