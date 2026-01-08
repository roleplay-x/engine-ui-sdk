import { Item } from '@roleplayx/engine-sdk';

import { GamemodeClient } from '../client';

export class GamemodeInventoryApi {
  constructor(private readonly client: GamemodeClient) {}

  public async getItems(query?: {
    parentItemIds?: ReadonlyArray<string>;
    locationIds?: ReadonlyArray<string>;
  }): Promise<ReadonlyArray<Item>> {
    return this.client.get<ReadonlyArray<Item>>({
      url: `inventories/items`,
      query,
    });
  }
}
