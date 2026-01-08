import { EquipmentSlot } from '@roleplayx/engine-sdk';

import { InventoryItem } from '../item';
import { Container } from '../container';
import { ServerTranslator } from '../../../../core/localization/server-translator';
import { ItemAction } from '../item-action';

export interface ItemActionFactoryParams {
  item: InventoryItem;
  equipmentSlots: ReadonlyArray<EquipmentSlot>;
  equippedItems: ReadonlyArray<InventoryItem>;
  containers: ReadonlyArray<Container>;
  containedItems: ReadonlyArray<InventoryItem>;
}

export abstract class ItemActionFactory {
  constructor(protected readonly serverTranslator: ServerTranslator) {}

  abstract create(params: ItemActionFactoryParams): ReadonlyArray<ItemAction>;
}
