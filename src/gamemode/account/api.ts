import {
  Account,
  AccountAuthRequest,
  DiscordUserAccountInfo,
  ExternalLoginAuthRequest,
  ExternalLoginPreAuthRequest,
  ExternalLoginPreAuthResult,
  GrantAccessResult,
  RedirectUri,
  RegisterAccountRequest,
} from '@roleplayx/engine-sdk';

import { GamemodeClient } from '../client';

import { ImplicitDiscordAuthApiRequest } from './request/implicit-discord-auth.api-request';
import { DiscordOAuthTokenApiRequest } from './request/discord-oauth-token.api-request';

export class GamemodeAccountApi {
  constructor(private readonly client: GamemodeClient) {}

  /**
   * Register a new account
   *
   * Creates a new player account with the provided credentials.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The registration request details
   * @returns The created account details
   * @throws EngineError when session is already authorized
   */
  public register(request: RegisterAccountRequest): Promise<Account> {
    return this.client.post<RegisterAccountRequest, Account>({
      url: `accounts`,
      data: request,
    });
  }

  /**
   * Authenticate with password
   *
   * Authenticates a player using their password. This endpoint is used to log in a player to the game server.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The authentication request containing username and password
   * @returns Grant access result with authentication token
   * @throws EngineError when session is already authorized
   */
  public authWithPassword(request: AccountAuthRequest): Promise<GrantAccessResult> {
    return this.client.post<AccountAuthRequest, GrantAccessResult>({
      url: `accounts/auth`,
      data: request,
    });
  }

  /**
   * External login pre-authentication
   *
   * Pre-authenticates a player for external login. This endpoint is used to initiate the external login flow.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The external login pre-auth request with provider details
   * @returns Pre-authentication result with redirect URL or token
   * @throws EngineError when session is already authorized
   */
  public preAuthExternalLogin(
    request: ExternalLoginPreAuthRequest,
  ): Promise<ExternalLoginPreAuthResult> {
    return this.client.post<ExternalLoginPreAuthRequest, ExternalLoginPreAuthResult>({
      url: `accounts/external-login/pre-auth`,
      data: request,
    });
  }

  /**
   * External login authentication
   *
   * Authenticates a player using external login credentials. This endpoint is used to complete the external login flow.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The external login auth request with provider token
   * @returns Grant access result with authentication token
   * @throws EngineError when session is already authorized
   */
  public authExternalLogin(request: ExternalLoginAuthRequest): Promise<GrantAccessResult> {
    return this.client.post<ExternalLoginAuthRequest, GrantAccessResult>({
      url: `accounts/external-login/auth`,
      data: request,
    });
  }

  /**
   * Get Discord user by session
   *
   * Retrieves a Discord user with the guild membership information by their unique identifier.
   * The session must not already be authorized (linked to an account).
   *
   * @returns Discord user account information
   * @throws EngineError when session is already authorized
   */
  public getDiscordUser(): Promise<DiscordUserAccountInfo> {
    return this.client.get<DiscordUserAccountInfo>({
      url: `accounts/discord`,
    });
  }

  /**
   * Authorize with implicit Discord flow
   *
   * This endpoint allows players to authenticate with Discord using the implicit flow. It returns a grant access result containing the player's account information and access token.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The implicit Discord authentication request
   * @returns Grant access result with authentication token
   * @throws EngineError when session is already authorized
   */
  public authDiscordImplicitFlow(
    request: ImplicitDiscordAuthApiRequest,
  ): Promise<GrantAccessResult> {
    return this.client.post<ImplicitDiscordAuthApiRequest, GrantAccessResult>({
      url: `accounts/discord/auth`,
      data: request,
    });
  }

  /**
   * Get Discord OAuth authorization URL
   *
   * This endpoint retrieves the OAuth authorization URL for Discord. It is used to initiate the OAuth flow for players to grant access to their Discord account.
   * The session must not already be authorized (linked to an account).
   *
   * @returns Discord OAuth authorization URL
   * @throws EngineError when session is already authorized
   */
  public getDiscordOAuthAuthorizeUrl(): Promise<RedirectUri> {
    return this.client.get<RedirectUri>({
      url: `accounts/discord/oauth/authorize`,
    });
  }

  /**
   * Authorize with Discord OAuth token
   *
   * This endpoint allows players to authenticate with Discord using OAuth tokens. It returns a grant access result containing the player's account information and access token.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The Discord OAuth token request
   * @returns Grant access result with authentication token
   * @throws EngineError when session is already authorized
   */
  public authDiscordOAuthFlow(request: DiscordOAuthTokenApiRequest): Promise<GrantAccessResult> {
    return this.client.post<DiscordOAuthTokenApiRequest, GrantAccessResult>({
      url: `accounts/discord/oauth/token`,
      data: request,
    });
  }
}
