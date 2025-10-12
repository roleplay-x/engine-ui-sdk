import {
  Account,
  AccountAuthRequest,
  DiscordUserAccountInfo,
  EngineError,
  ExternalLoginAuthRequest,
  ExternalLoginIdentifierType,
  ExternalLoginPreAuthRequest,
  ExternalLoginPreAuthResult,
  ForgotPasswordRequest,
  GrantAccessResult,
  PublicApi,
  RedirectUri,
  RegisterAccountRequest,
  ResendEmailVerificationRequest,
  SessionInfo,
} from '@roleplayx/engine-sdk';

import { Screen, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';
import { GamemodeAccountApi } from '../../gamemode/account/api';
import { ImplicitDiscordAuthApiRequest } from '../../gamemode/account/request/implicit-discord-auth.api-request';
import { DiscordOAuthTokenApiRequest } from '../../gamemode/account/request/discord-oauth-token.api-request';
import { GamemodeSessionApi } from '../../gamemode/session/api';

import { AuthScreenConfiguration } from './configuration';

export type AuthScreenEvents = ScreenEvents;

export class AuthScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<AuthScreenEvents, AuthScreenConfiguration, TLocalization, TConfiguration> {
  private _gamemodeAccountApi: GamemodeAccountApi | undefined;
  private _gamemodeSessionApi: GamemodeSessionApi | undefined;
  private _enginePublicApi: PublicApi | undefined;

  constructor(defaultSettings: ScreenSettings<TLocalization, TConfiguration>) {
    super(ScreenType.Auth, defaultSettings);
  }

  protected async onInit(): Promise<void> {
    this.screenConfiguration = this.mapConfiguration();
    this._gamemodeAccountApi = new GamemodeAccountApi(this.gamemodeClient);
    this._gamemodeSessionApi = new GamemodeSessionApi(this.gamemodeClient);
    this._enginePublicApi = new PublicApi(this.engineClient);
    return super.onInit();
  }

  public register(request: RegisterAccountRequest): Promise<Account> {
    return this.gamemodeAccountApi.register(request);
  }

  public async authWithPassword(
    request: AccountAuthRequest,
    onEmailVerificationPending: () => void | Promise<void>,
  ): Promise<SessionInfo | undefined> {
    try {
      const result = await this.gamemodeAccountApi.authWithPassword(request);
      return await this.authorizeSession(result);
    } catch (err) {
      if (this.handleEmailVerificationRequiredError(err as Error)) {
        onEmailVerificationPending();
        return;
      }

      throw err;
    }
  }

  public preAuthExternalLogin(
    request: ExternalLoginPreAuthRequest,
  ): Promise<ExternalLoginPreAuthResult> {
    return this.gamemodeAccountApi.preAuthExternalLogin(request);
  }

  public async authExternalLogin(request: ExternalLoginAuthRequest): Promise<SessionInfo> {
    const result = await this.gamemodeAccountApi.authExternalLogin(request);
    return this.authorizeSession(result);
  }

  public async authDiscordImplicitFlow(
    request: ImplicitDiscordAuthApiRequest,
    onEmailVerificationPending: () => void | Promise<void>,
  ): Promise<SessionInfo | undefined> {
    try {
      const result = await this.gamemodeAccountApi.authDiscordImplicitFlow(request);
      return await this.authorizeSession(result);
    } catch (err) {
      if (this.handleEmailVerificationRequiredError(err as Error)) {
        onEmailVerificationPending();
        return;
      }

      throw err;
    }
  }

  public async authDiscordOAuthFlow(request: DiscordOAuthTokenApiRequest): Promise<SessionInfo> {
    const result = await this.gamemodeAccountApi.authDiscordOAuthFlow(request);
    return this.authorizeSession(result);
  }

  public getDiscordOAuthAuthorizeUrl(): Promise<RedirectUri> {
    return this.gamemodeAccountApi.getDiscordOAuthAuthorizeUrl();
  }

  public getDiscordUser(): Promise<DiscordUserAccountInfo> {
    return this.gamemodeAccountApi.getDiscordUser();
  }

  public forgotPassword(request: ForgotPasswordRequest) {
    return this.enginePublicApi.forgotPassword(request);
  }

  public resendEmailVerification(request: ResendEmailVerificationRequest) {
    return this.enginePublicApi.resendEmailVerification(request);
  }

  private handleEmailVerificationRequiredError(error: Error): boolean {
    return error instanceof EngineError && error.key === 'EMAIL_VERIFICATION_REQUIRED';
  }

  private mapConfiguration(): AuthScreenConfiguration {
    let configuration: AuthScreenConfiguration = {
      usernameRegex: this.serverConfiguration.ACCOUNT_USERNAME_REGEX.value.expression,
      emailRequired: this.serverConfiguration.ACCOUNT_EMAIL_REQUIRED.value,
      emailVerificationRequired: this.serverConfiguration.ACCOUNT_EMAIL_VERIFICATION_REQUIRED.value,
    };

    if (this.serverConfiguration.USERNAME_PASSWORD_FLOW_ENABLED.value.enabled) {
      configuration = {
        ...configuration,
        usernamePassword: {
          passwordRegex: this.serverConfiguration.ACCOUNT_PASSWORD_REGEX.value.expression,
          registrationEnabled:
            this.serverConfiguration.USERNAME_PASSWORD_FLOW_REGISTRATION_ENABLED.value,
        },
      };
    }

    if (this.serverConfiguration.EXTERNAL_LOGIN_FLOW_ENABLED.value.enabled) {
      configuration = {
        ...configuration,
        externalLogin: {
          identifierType: this.serverConfiguration.EXTERNAL_LOGIN_FLOW_IDENTIFIER_TYPE.value
            .key as ExternalLoginIdentifierType,
        },
      };
    }

    if (this.serverConfiguration.DISCORD_LOGIN_FLOW_ENABLED.value.enabled) {
      configuration = {
        ...configuration,
        discord: {
          flow: this.serverConfiguration.DISCORD_LOGIN_FLOW_IN_GAME_METHOD.value.key as
            | 'IMPLICIT'
            | 'OAUTH2',
          autoLogin: this.serverConfiguration.DISCORD_LOGIN_FLOW_AUTO_LOGIN.value,
        },
      };
    }

    return configuration;
  }

  private authorizeSession(result: GrantAccessResult): Promise<SessionInfo> {
    return this.gamemodeSessionApi.authorizeSession({ accessToken: result.access_token });
  }

  private get gamemodeAccountApi(): GamemodeAccountApi {
    if (!this._gamemodeAccountApi) {
      throw new Error('Screen is not initialized');
    }
    return this._gamemodeAccountApi;
  }

  private get gamemodeSessionApi(): GamemodeSessionApi {
    if (!this._gamemodeSessionApi) {
      throw new Error('Screen is not initialized');
    }
    return this._gamemodeSessionApi;
  }

  private get enginePublicApi(): PublicApi {
    if (!this._enginePublicApi) {
      throw new Error('Screen is not initialized');
    }
    return this._enginePublicApi;
  }
}
