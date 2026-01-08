import {
  ComponentType,
  ItemActionType,
  ItemLocationType,
  UsableAction,
  UsableActionFlag,
  UsableComponent,
  UsableTargetType,
} from '@roleplayx/engine-sdk';

import { InventoryItem } from '../item';
import { ItemAction, ItemActionOption } from '../item-action';

import { ItemActionFactory, ItemActionFactoryParams } from './item-action.factory';

export class ItemUsableActionFactory extends ItemActionFactory {
  create({ item }: ItemActionFactoryParams): ReadonlyArray<ItemAction> {
    const component = item.getComponent<UsableComponent>(ComponentType.Usable);
    if (!component || item.isSpoiled) {
      return [];
    }

    const actions: ItemAction[] = [];
    for (const action of component.actions) {
      if (!this.isActionApplicable(item, action)) {
        continue;
      }

      const itemAction = new ItemAction({
        type: ItemActionType.Usable,
        code: action.actionId,
        name: action.actionName ?? action.actionId,
        isVisibleWhenIdle: true,
        amountSelectable: action.amountSelectable && item.amount >= 1,
        duration: action.duration,
        defaultAmount: item.amount >= 1 ? item.amount : item.amount,
        cooldown: action.cooldown,
        cooldownResetAt: item.state.usable?.actionCooldowns?.[action.actionId]
          ? new Date(item.state.usable?.actionCooldowns?.[action.actionId])
          : undefined,
      });

      if (component.target?.targetType === UsableTargetType.SelfOrOtherPlayer) {
        itemAction.addOptions([
          ItemActionOption.create({
            parentId: itemAction.id,
            code: UsableTargetType.Self,
            name: this.serverTranslator.translateExpression(
              'inventory',
              'usableTargetTypes',
              UsableTargetType.Self,
              (t) => t.name,
              {},
            ),
            isVisibleWhenIdle: true,
            amountSelectable: action.amountSelectable && item.amount >= 1,
            duration: action.duration,
            defaultAmount: item.amount >= 1 ? 1 : item.amount,
            cooldown: action.cooldown,
            cooldownResetAt: item.state.usable?.actionCooldowns?.[action.actionId]
              ? new Date(item.state.usable?.actionCooldowns?.[action.actionId])
              : undefined,
            parameters: {
              TARGET_TYPE: UsableTargetType.Self,
            },
          }),
          ItemActionOption.create({
            parentId: itemAction.id,
            code: UsableTargetType.OtherPlayer,
            name: this.serverTranslator.translateExpression(
              'inventory',
              'usableTargetTypes',
              UsableTargetType.OtherPlayer,
              (t) => t.name,
              {},
            ),
            isVisibleWhenIdle: true,
            amountSelectable: action.amountSelectable && item.amount >= 1,
            duration: action.duration,
            defaultAmount: item.amount >= 1 ? item.amount : item.amount,
            cooldown: action.cooldown,
            cooldownResetAt: item.state.usable?.actionCooldowns?.[action.actionId]
              ? new Date(item.state.usable?.actionCooldowns?.[action.actionId])
              : undefined,
            parameters: {
              TARGET_TYPE: UsableTargetType.OtherPlayer,
            },
          }),
        ]);
      }

      actions.push(itemAction);
    }

    return actions;
  }

  private isActionApplicable(item: InventoryItem, action: UsableAction): boolean {
    if (
      action.condition?.blockedStates?.length &&
      item.state.usable?.actionState &&
      action.condition.blockedStates.includes(item.state.usable.actionState)
    ) {
      return false;
    }

    if (
      action.condition?.allowedStates?.length &&
      item.state.usable?.actionState &&
      !action.condition.allowedStates.includes(item.state.usable.actionState)
    ) {
      return false;
    }

    if (!this.isActionFlagsApplicable(item, action)) {
      return false;
    }

    if (item.state.usable?.remaining != null && item.state.usable?.remaining <= 0) {
      return false;
    }

    // TODO: check skill requirement
    return true;
  }

  private isActionFlagsApplicable(item: InventoryItem, action: UsableAction) {
    if (!action.condition?.flags?.length) {
      return (
        item.location.type !== ItemLocationType.World &&
        item.location.type !== ItemLocationType.Vehicle &&
        item.location.type !== ItemLocationType.CraftingStation &&
        item.location.type !== ItemLocationType.Warehouse
      );
    }

    for (const flag of action.condition.flags) {
      switch (flag) {
        case UsableActionFlag.InContainer:
          if (item.location.type === ItemLocationType.Container) {
            return true;
          }
          break;
        case UsableActionFlag.InInventory:
          if (
            item.location.type !== ItemLocationType.World &&
            item.location.type !== ItemLocationType.Vehicle &&
            item.location.type !== ItemLocationType.CraftingStation &&
            item.location.type !== ItemLocationType.Warehouse
          ) {
            return true;
          }
          break;
        case UsableActionFlag.OnEquipped:
          if (
            item.location.type === ItemLocationType.Character ||
            item.location.type === ItemLocationType.Vehicle
          ) {
            return true;
          }
          break;
        case UsableActionFlag.InVehicle:
          //TODO: check character state
          break;
        case UsableActionFlag.OnAttached:
          if (item.location.type === ItemLocationType.Attached) {
            return true;
          }
          break;
        case UsableActionFlag.OnGround:
          if (item.location.type === ItemLocationType.World) {
            return true;
          }
          break;
      }
    }

    return false;
  }
}
