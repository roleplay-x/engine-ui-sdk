import { EngineClient, PublicApi, PublicConfig } from '@roleplayx/engine-sdk';

import { ShellInitializeScreen } from '../core/shell/events/shell-events';
import { ScreenType } from '../core/screen/screen-type';
import { ServerConfiguration } from '../core/server/server-configuration';

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
}

export class LocalShell {
  constructor(private settings: LocalShellSettings) {
    window.addEventListener('localShell:initializeScreen', this.onInitialize.bind(this));
  }

  private onInitialize(event: Event) {
    const customEvent = event as CustomEvent<LocalShellInitializeScreen>;
    return this.handleLocalShellInitialize(customEvent.detail);
  }

  private async handleLocalShellInitialize({
    screen,
    locale,
    sessionId,
    sessionToken,
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
      defaultLocale: serverConfiguration.DEFAULT_LANGUAGE?.key ?? 'en-US',
      locales,
    };

    window.parent.postMessage(
      {
        type: 'shell:initializeScreen',
        payload,
      },
      '*',
    );
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
