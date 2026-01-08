import { AttachableComponent, ComponentType, ItemActionType } from '@roleplayx/engine-sdk';

import { ItemAction } from '../item-action';

import { ItemActionFactory, ItemActionFactoryParams } from './item-action.factory';

export class ItemAttachableActionFactory extends ItemActionFactory {
  create({ item, containedItems }: ItemActionFactoryParams): ReadonlyArray<ItemAction> {
    const component = item.getComponent<AttachableComponent>(ComponentType.Attachable);
    if (!component || item.isSpoiled) {
      return [];
    }

    const relatedItemIds = new Set(
      containedItems
        .filter(
          (containedItem) =>
            containedItem.supportsAttachment(item.category.id, component.attachmentPoint) &&
            containedItem.matchesAnyCategory(component.attachableToCategories),
        )
        .map((p) => p.id),
    );

    const action = new ItemAction({
      type: ItemActionType.Attachable,
      code: 'ATTACH',
      name: this.serverTranslator.translateExpression(
        'texts',
        'INVENTORY_ATTACHABLE_ACTION_NAME',
        (t) => t.message,
        {},
      ),
      relatedItemIds,
      isVisibleWhenIdle: false,
      amountSelectable: false,
      parameters: {
        ATTACHMENT_POINT: component.attachmentPoint,
      },
    });

    return [action];
  }
}
