import { AuthorizeSessionRequest, SessionInfo } from '@roleplayx/engine-sdk';

import { GamemodeClient } from '../client';

export class GamemodeSessionApi {
  constructor(private readonly client: GamemodeClient) {}

  /**
   * Authorize session
   *
   * Authorizes a session with the given access token. It associates the session with the account that owns the access token.
   * The session must not already be authorized (linked to an account).
   *
   * @param request - The authorize session request containing access token
   * @returns Session information with account and character details
   * @throws EngineError when session is already authorized
   */
  public async authorizeSession(request: AuthorizeSessionRequest): Promise<SessionInfo> {
    return this.client.put<AuthorizeSessionRequest, SessionInfo>({
      url: `sessions/auth`,
      data: request,
    });
  }
}
