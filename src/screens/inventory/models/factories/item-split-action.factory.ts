import { ComponentType, EquippableComponent, ItemActionType } from '@roleplayx/engine-sdk';

import { ItemAction } from '../item-action';

import { ItemActionFactory, ItemActionFactoryParams } from './item-action.factory';

export class ItemSplitActionFactory extends ItemActionFactory {
  create({ item }: ItemActionFactoryParams): ReadonlyArray<ItemAction> {
    const component = item.getComponent<EquippableComponent>(ComponentType.Stackable);
    if (!component || item.amount <= 1) {
      return [];
    }

    const half = Math.floor(item.amount / 2);
    const action = new ItemAction({
      type: ItemActionType.Split,
      code: 'SPLIT',
      name: this.serverTranslator.translateExpression(
        'texts',
        'INVENTORY_SPLIT_ACTION_NAME',
        (t) => t.message,
        {},
      ),
      isVisibleWhenIdle: true,
      amountSelectable: true,
      defaultAmount: half < 1 ? 1 : half,
    });

    return [action];
  }
}
