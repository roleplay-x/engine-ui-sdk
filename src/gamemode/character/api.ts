import { UpdateCharacterAppearanceRequest } from '@roleplayx/engine-sdk';

import { GamemodeClient } from '../client';

export class GamemodeCharacterApi {
  constructor(private readonly client: GamemodeClient) {}

  /**
   * Update character appearance
   *
   * Updates the appearance data for the currently linked character. The session must be
   * linked to a character (EndpointScope.CHARACTER). Appearance data is provided as
   * key-value pairs and will be validated against blueprint configurations.
   *
   * @param request - The update request containing appearance data
   * @throws EngineError when there is an error
   */
  public async updateCharacterAppearance(request: UpdateCharacterAppearanceRequest): Promise<void> {
    return this.client.put<UpdateCharacterAppearanceRequest, void>({
      url: `characters/appearance`,
      data: request,
    });
  }
}
