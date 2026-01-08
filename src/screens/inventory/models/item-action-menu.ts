import { ItemAction } from './item-action';

export class ItemActionMenu {
  private readonly _actions: ReadonlyArray<ItemAction>;
  private readonly _relatedItemIds: Set<string>;
  private readonly _relatedEquipmentSlotIds: Set<string>;
  private readonly _relatedLocationIds: Set<string>;
  private readonly _relatedCurrencyIds: Set<string>;

  constructor(actions: ReadonlyArray<ItemAction>) {
    this._actions = actions;
    this._relatedItemIds = new Set([...actions.flatMap((p) => [...p.relatedItemIds])]);
    this._relatedEquipmentSlotIds = new Set([
      ...actions.flatMap((p) => [...p.relatedEquipmentSlotIds]),
    ]);
    this._relatedLocationIds = new Set([...actions.flatMap((p) => [...p.relatedLocationIds])]);
    this._relatedCurrencyIds = new Set([...actions.flatMap((p) => [...p.relatedCurrencyIds])]);
  }

  get actions(): ReadonlyArray<ItemAction> {
    return this._actions;
  }

  get relatedItemIds(): Set<string> {
    return this._relatedItemIds;
  }

  get relatedEquipmentSlotIds(): Set<string> {
    return this._relatedEquipmentSlotIds;
  }

  get relatedLocationIds(): Set<string> {
    return this._relatedLocationIds;
  }

  get relatedCurrencyIds(): Set<string> {
    return this._relatedCurrencyIds;
  }
}
