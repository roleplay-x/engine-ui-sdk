import { ComponentType, EquippableComponent, ItemActionType } from '@roleplayx/engine-sdk';

import { ItemAction, ItemActionOption } from '../item-action';

import { ItemActionFactory, ItemActionFactoryParams } from './item-action.factory';

export class ItemEquippableActionFactory extends ItemActionFactory {
  create({ item }: ItemActionFactoryParams): ReadonlyArray<ItemAction> {
    const component = item.getComponent<EquippableComponent>(ComponentType.Equippable);
    if (!component || item.isSpoiled || !component.equipmentSlots.length) {
      return [];
    }

    const action = new ItemAction({
      type: ItemActionType.Equippable,
      code: 'EQUIP',
      name: this.serverTranslator.translateExpression(
        'texts',
        'INVENTORY_EQUIPPABLE_ACTION_NAME',
        (t) => t.message,
        {},
      ),
      isVisibleWhenIdle: true,
      relatedEquipmentSlotIds: new Set(component.equipmentSlots.map((p) => p.id)),
      amountSelectable: false,
    });

    if (component.equipmentSlots.length > 1) {
      const options = component.equipmentSlots.map((equipmentSlot) => {
        return ItemActionOption.create({
          parentId: action.id,
          code: equipmentSlot.id,
          name: equipmentSlot.name ?? equipmentSlot.id,
          parameters: {
            EQUIPMENT_SLOT: equipmentSlot.id,
          },
          isVisibleWhenIdle: true,
          amountSelectable: false,
        });
      });

      action.addOptions(options);
    }

    return [action];
  }
}
