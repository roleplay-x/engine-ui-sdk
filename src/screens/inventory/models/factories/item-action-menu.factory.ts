import { ServerTranslator } from '../../../../core/localization/server-translator';
import { ItemActionMenu } from '../item-action-menu';
import { ItemAction } from '../item-action';

import { ItemActionFactory, ItemActionFactoryParams } from './item-action.factory';
import { ItemUsableActionFactory } from './item-usable-action.factory';
import { ItemEquippableActionFactory } from './item-equippable-action.factory';
import { ItemAttachableActionFactory } from './item-attachable-action.factory';
import { ItemSplitActionFactory } from './item-split-action.factory';
import { ItemMoveActionFactory } from './item-move-action.factory';

export class ItemActionMenuFactory {
  private readonly _itemActionFactories: ItemActionFactory[];

  constructor(serverTranslator: ServerTranslator) {
    this._itemActionFactories = [
      new ItemUsableActionFactory(serverTranslator),
      new ItemEquippableActionFactory(serverTranslator),
      new ItemAttachableActionFactory(serverTranslator),
      new ItemSplitActionFactory(serverTranslator),
      new ItemMoveActionFactory(serverTranslator),
    ];
  }

  public create(params: ItemActionFactoryParams): ItemActionMenu {
    const actions: ItemAction[] = [];
    for (const factory of this._itemActionFactories) {
      actions.push(...factory.create(params));
    }
    return new ItemActionMenu(actions);
  }
}
