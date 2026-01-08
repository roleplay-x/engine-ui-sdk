import {
  AttachmentSlotsComponent,
  ComponentType,
  Item,
  ItemCategory,
  ItemComponent,
  ItemLocation,
  ItemLocationType,
  ItemMobility,
  ItemState,
  MaterialType,
  PerishableComponent,
  Unit,
  UsableComponent,
} from '@roleplayx/engine-sdk';

import { matchesItemCategory } from './item-category';

export class InventoryItem {
  private readonly _base: Item;
  private readonly _components: Map<ComponentType, ItemComponent> = new Map();
  private readonly _spoilAt: Date | undefined;

  constructor(item: Item) {
    this._base = { ...item };
    this._base.components.forEach((component) => {
      this._components.set(component.type, component);
    });
    this._spoilAt = this.calculateSpoilAt();
  }

  get id(): string {
    return this._base.id;
  }

  get definitionId(): string {
    return this._base.definitionId;
  }

  get definitionCode(): string {
    return this._base.definitionCode;
  }

  get definitionRevisionNumber(): number {
    return this._base.definitionRevisionNumber;
  }

  get name(): string | undefined {
    return this._base.name;
  }

  get description(): string | undefined {
    return this._base.description;
  }

  get amount(): number {
    return this._base.amount;
  }

  get mobility(): ItemMobility | undefined {
    return this._base.mobility;
  }

  get location(): ItemLocation {
    return this._base.location;
  }

  get state(): ItemState {
    return this._base.state;
  }

  get attachedTo(): string | undefined {
    return this._base.attachedTo;
  }

  get materialType(): MaterialType | undefined {
    return this._base.materialType;
  }

  get components(): ReadonlyArray<ItemComponent> {
    return this._base.components;
  }

  get category(): ItemCategory {
    return this._base.category;
  }

  get primaryUnit(): Unit {
    return this._base.primaryUnit;
  }

  get weightPerUnit(): number {
    return this._base.weightPerUnit;
  }

  get volumePerUnit(): number {
    return this._base.volumePerUnit;
  }

  get iconUrl(): string | undefined {
    const actionState = this.state.usable?.actionState;
    if (actionState) {
      const usableComponent = this.getComponent<UsableComponent>(ComponentType.Usable);
      const state = usableComponent?.states?.find((p) => p.stateId === actionState);
      if (state?.iconUrl) {
        return state.iconUrl;
      }
    }

    return this._base.iconUrl;
  }

  get attributes(): Readonly<Record<string, string>> {
    return this._base.attributes ?? {};
  }

  get totalWeight(): number {
    return this._base.totalWeight;
  }

  get totalVolume(): number {
    return this._base.totalVolume;
  }

  get isSpoiled(): boolean {
    return !!this._spoilAt && this._spoilAt < new Date();
  }

  get spoilAt(): Date | undefined {
    return this._spoilAt;
  }

  public getLocationIdForChildren(): string | undefined {
    if (this.hasComponent(ComponentType.Container)) {
      return `${ItemLocationType.Container}:${this.id}`;
    }

    if (this.hasComponent(ComponentType.AttachmentSlots)) {
      return `${ItemLocationType.Attached}:${this.id}`;
    }

    return;
  }

  public hasComponent(componentType: ComponentType) {
    return this._components.has(componentType);
  }

  public supportsChildItems() {
    return (
      this.hasComponent(ComponentType.Container) || this.hasComponent(ComponentType.AttachmentSlots)
    );
  }

  public getComponent<TComponent extends ItemComponent>(componentType: ComponentType) {
    return this._components.get(componentType) as TComponent | undefined;
  }

  public matchesCategory(pattern: string): boolean {
    return matchesItemCategory(pattern, this.category.id);
  }

  public matchesAnyCategory(patterns: ReadonlyArray<string>): boolean {
    for (const pattern of patterns) {
      if (matchesItemCategory(pattern, this.category.id)) {
        return true;
      }
    }

    return false;
  }

  public supportsAttachment(category: string, attachmentPoint: string): boolean {
    const component = this.getComponent<AttachmentSlotsComponent>(ComponentType.Attachable);
    if (!component) {
      return false;
    }

    const slot = component.slots.find((a) => a.attachmentPoint === attachmentPoint);
    if (!slot) {
      return false;
    }

    if (
      slot.allowedCategories &&
      !slot.allowedCategories.some((pattern) => matchesItemCategory(pattern, category))
    ) {
      return false;
    }

    return true;
  }

  private calculateSpoilAt(): Date | undefined {
    const component = this.getComponent<PerishableComponent>(ComponentType.Perishable);
    const perishableState = this.state.perishable;

    if (!component || !perishableState) {
      return undefined;
    }

    const accumulated = perishableState.accumulatedDecayMs ?? 0;
    const lastTs = perishableState.lastLocationTimestamp;

    if (!lastTs) {
      return undefined;
    }

    const remaining = Math.max(0, component.spoilDuration - accumulated);
    const spoilAtMs = lastTs + remaining;

    return new Date(spoilAtMs);
  }
}
