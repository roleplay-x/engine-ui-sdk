import { ComponentType, ItemActionType, ItemLocationType } from '@roleplayx/engine-sdk';

import { ItemAction, ItemActionOption } from '../item-action';

import { ItemActionFactory, ItemActionFactoryParams } from './item-action.factory';

export class ItemMoveActionFactory extends ItemActionFactory {
  create({ item, containers }: ItemActionFactoryParams): ReadonlyArray<ItemAction> {
    if (item.state.binding.type !== 'NONE') {
      return [];
    }

    if (
      item.location.type === ItemLocationType.World &&
      item.mobility &&
      !item.mobility.canPickup
    ) {
      return [];
    }

    const amountSelectable = item.amount >= 1;
    const defaultAmount = item.amount >= 1 ? 1 : item.amount;

    const action = new ItemAction({
      type: ItemActionType.Move,
      code: 'MOVE',
      name: this.serverTranslator.translateExpression(
        'texts',
        'INVENTORY_MOVE_ACTION_NAME',
        (t) => t.message,
        {},
      ),
      isVisibleWhenIdle: true,
      amountSelectable,
      defaultAmount,
    });

    const options: ItemActionOption[] = [];
    if (item.hasComponent(ComponentType.Currency)) {
      options.push(
        ItemActionOption.create({
          parentId: action.id,
          code: 'LEDGER',
          name: this.serverTranslator.translateExpression(
            'texts',
            'INVENTORY_MOVE_TO_LEDGER',
            (t) => t.message,
            {},
          ),
          isVisibleWhenIdle: true,
          amountSelectable,
          defaultAmount,
          parameters: {
            TARGET_LOCATION_ID: 'LEDGER',
          },
          relatedLocationIds: new Set(['LEDGER']),
        }),
      );
    }

    for (const container of containers) {
      if (item.location?.container?.containerId === container.id) {
        continue;
      }

      if (!container.name) {
        continue;
      }

      if (!container.canContainItem(item)) {
        continue;
      }

      const locationId = `CONTAINER:${container.id}`;
      options.push(
        ItemActionOption.create({
          parentId: action.id,
          code: locationId,
          name: container.name,
          isVisibleWhenIdle: true,
          amountSelectable,
          defaultAmount,
          parameters: {
            TARGET_LOCATION_ID: locationId,
          },
          relatedLocationIds: new Set([locationId]),
        }),
      );
    }

    if (!item.mobility || item.mobility.canDrop) {
      options.push(
        ItemActionOption.create({
          parentId: action.id,
          code: 'WORLD',
          name: this.serverTranslator.translateExpression(
            'texts',
            'INVENTORY_MOVE_TO_WORLD',
            (t) => t.message,
            {},
          ),
          isVisibleWhenIdle: true,
          amountSelectable,
          defaultAmount,
          parameters: {
            TARGET_LOCATION_ID: 'WORLD',
          },
          relatedLocationIds: new Set(['WORLD']),
        }),
      );
    }

    if (!options.length) {
      return [];
    }

    action.addOptions(options);
    return [action];
  }
}
