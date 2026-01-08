import { ComponentType, ContainerComponent, Item } from '@roleplayx/engine-sdk';

import { InventoryItem } from './item';

export class Container extends InventoryItem {
  private readonly _itemIds: Set<string> = new Set([]);

  constructor(item: Item) {
    super(item);
  }

  get itemIds(): Set<string> {
    return this._itemIds;
  }

  get availableVolume(): number | undefined {
    const component = this.getComponent<ContainerComponent>(ComponentType.Container);
    if (!component) {
      return;
    }

    if (!component.maxVolume) {
      return;
    }

    return Math.max(0, component.maxVolume - (this.state.container?.volume ?? 0));
  }

  get availableWeight(): number | undefined {
    const component = this.getComponent<ContainerComponent>(ComponentType.Container);
    if (!component) {
      return;
    }

    if (!component.maxWeight) {
      return;
    }

    return Math.max(0, component.maxWeight - (this.state.container?.weight ?? 0));
  }

  get availableSlots(): number | undefined {
    const component = this.getComponent<ContainerComponent>(ComponentType.Container);
    if (!component) {
      return;
    }

    if (!component.maxSlotCount) {
      return;
    }

    return Math.max(0, component.maxSlotCount - (this.state.container?.slots ?? 0));
  }

  public canContainItem(item: InventoryItem) {
    const component = this.getComponent<ContainerComponent>(ComponentType.Container);
    if (!component) {
      return false;
    }

    if (
      component.allowedCategories?.length &&
      !item.matchesAnyCategory(component.allowedCategories)
    ) {
      return false;
    }

    if (
      component.blockedCategories?.length &&
      item.matchesAnyCategory(component.blockedCategories)
    ) {
      return false;
    }

    const availableWeight = this.availableWeight;
    if (availableWeight && availableWeight < item.totalWeight) {
      return false;
    }

    const availableVolume = this.availableVolume;
    if (availableVolume && availableVolume < item.totalVolume) {
      return false;
    }

    const availableSlots = this.availableSlots;
    return !(availableSlots && availableSlots < 1);
  }
}
