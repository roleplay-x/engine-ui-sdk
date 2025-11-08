import { UpdateCharacterAppearanceRequest } from '@roleplayx/engine-sdk';

import { GamemodeClient } from '../client';

import { SpawnMyCharacterApiRequest } from './request/spawn-my-character.api-request';

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

  /**
   * Spawn character at selected location
   *
   * Spawns the currently linked character at the selected spawn location. The session must be
   * linked to a character (EndpointScope.CHARACTER) and the character must not have been spawned yet.
   * The spawn location must be valid for the character.
   *
   * @param request - The spawn request containing the selected spawn location ID
   * @throws EngineError when there is an error
   */
  public async spawnMyCharacter(request: SpawnMyCharacterApiRequest): Promise<void> {
    return this.client.post<SpawnMyCharacterApiRequest, void>({
      url: `characters/spawn`,
      data: request,
    });
  }
}
