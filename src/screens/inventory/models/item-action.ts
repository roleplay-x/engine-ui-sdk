import { ItemActionType } from '@roleplayx/engine-sdk';
import moment from 'moment';
import _ from 'lodash';

export class ItemActionOption {
  private readonly _id: string;
  private readonly _code: string;
  private readonly _name: string;
  private readonly _animationId?: string;
  private readonly _options: ItemActionOption[] = [];
  private readonly _parameters: Record<string, string>;
  private readonly _cooldown?: number;
  private readonly _duration?: number;
  private readonly _amountSelectable: boolean;
  private readonly _defaultAmount: number;
  private readonly _isVisibleWhenIdle: boolean;
  private _cooldownResetAt?: Date;
  private _relatedItemIds: Set<string>;
  private _relatedEquipmentSlotIds: Set<string>;
  private _relatedLocationIds: Set<string>;
  private _relatedCurrencyIds: Set<string>;

  protected constructor({
    id,
    code,
    name,
    animationId,
    isVisibleWhenIdle,
    duration,
    cooldown,
    cooldownResetAt,
    amountSelectable,
    defaultAmount,
    parameters,
    relatedItemIds,
    relatedEquipmentSlotIds,
    relatedLocationIds,
    relatedCurrencyIds,
  }: {
    id: string;
    code: string;
    name: string;
    isVisibleWhenIdle: boolean;
    animationId?: string;
    duration?: number;
    cooldown?: number;
    cooldownResetAt?: Date;
    amountSelectable: boolean;
    defaultAmount?: number;
    parameters?: Record<string, string>;
    relatedItemIds?: Set<string>;
    relatedEquipmentSlotIds?: Set<string>;
    relatedLocationIds?: Set<string>;
    relatedCurrencyIds?: Set<string>;
  }) {
    this._id = id;
    this._code = code;
    this._name = name;
    this._isVisibleWhenIdle = isVisibleWhenIdle;
    this._animationId = animationId;
    this._parameters = parameters ?? {};
    this._duration = duration;
    this._cooldown = cooldown;
    this._cooldownResetAt =
      cooldownResetAt && cooldownResetAt > new Date() ? cooldownResetAt : undefined;
    this._relatedItemIds = relatedItemIds ?? new Set([]);
    this._relatedEquipmentSlotIds = relatedEquipmentSlotIds ?? new Set([]);
    this._relatedLocationIds = relatedLocationIds ?? new Set([]);
    this._relatedCurrencyIds = relatedCurrencyIds ?? new Set([]);
    this._amountSelectable = amountSelectable;
    this._defaultAmount = defaultAmount ?? 1;
  }

  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get isVisibleWhenIdle(): boolean {
    return this._isVisibleWhenIdle;
  }

  get animationId(): string | undefined {
    return this._animationId;
  }

  get options(): readonly ItemActionOption[] {
    return this._options;
  }

  get parameters(): Record<string, string> {
    return this._parameters;
  }

  get cooldown(): number | undefined {
    return this._cooldown;
  }

  get cooldownResetAt(): Date | undefined {
    return this._cooldownResetAt;
  }

  get duration(): number | undefined {
    return this._duration;
  }

  get amountSelectable(): boolean {
    return this._amountSelectable;
  }

  get defaultAmount(): number {
    return this._defaultAmount;
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

  public addOptions(options: ReadonlyArray<ItemActionOption>) {
    this._options.push(...options);
    this._relatedItemIds = new Set([
      ...this._relatedItemIds,
      ...options.flatMap((p) => [...p._relatedItemIds]),
    ]);
    this._relatedEquipmentSlotIds = new Set([
      ...this._relatedEquipmentSlotIds,
      ...options.flatMap((p) => [...p._relatedEquipmentSlotIds]),
    ]);
    this._relatedLocationIds = new Set([
      ...this._relatedLocationIds,
      ...options.flatMap((p) => [...p._relatedLocationIds]),
    ]);
    this._relatedCurrencyIds = new Set([
      ...this._relatedCurrencyIds,
      ...options.flatMap((p) => [...p._relatedCurrencyIds]),
    ]);
  }

  public execute(idParts: ReadonlyArray<string>): {
    executedActionId: string;
    cooldownResetAt: Date | undefined;
  } {
    if (idParts.length && idParts[0]) {
      const option = this._options.find((p) => p.code === idParts[0]);
      if (option) {
        const result = option.execute(idParts.slice(1));
        this._cooldownResetAt = result.cooldownResetAt;
        return result;
      }
    }

    if (this._cooldown) {
      this._cooldownResetAt = moment().add(this._cooldown, 'milliseconds').toDate();
    }

    return { executedActionId: this._id, cooldownResetAt: this._cooldownResetAt };
  }

  public getMinCooldownResetAt(): Date | undefined {
    const minSubCooldown = _.minBy(
      this.options,
      (option) => option._cooldownResetAt,
    )?._cooldownResetAt;

    if (minSubCooldown && (!this._cooldownResetAt || minSubCooldown < this._cooldownResetAt)) {
      return minSubCooldown;
    }

    if (!this._cooldownResetAt || this._cooldownResetAt < new Date()) {
      return;
    }

    return this._cooldownResetAt;
  }

  public static create({
    parentId,
    code,
    name,
    isVisibleWhenIdle,
    animationId,
    duration,
    cooldown,
    cooldownResetAt,
    amountSelectable,
    defaultAmount,
    parameters,
    relatedItemIds,
    relatedEquipmentSlotIds,
    relatedLocationIds,
    relatedCurrencyIds,
  }: {
    parentId: string;
    code: string;
    name: string;
    isVisibleWhenIdle: boolean;
    animationId?: string;
    duration?: number;
    cooldown?: number;
    cooldownResetAt?: Date;
    amountSelectable: boolean;
    defaultAmount?: number;
    parameters?: Record<string, string>;
    relatedItemIds?: Set<string>;
    relatedEquipmentSlotIds?: Set<string>;
    relatedLocationIds?: Set<string>;
    relatedCurrencyIds?: Set<string>;
  }) {
    return new ItemActionOption({
      id: `${parentId}:${code}`,
      name,
      code,
      isVisibleWhenIdle,
      animationId,
      duration,
      cooldown,
      cooldownResetAt,
      amountSelectable,
      defaultAmount,
      parameters,
      relatedItemIds,
      relatedEquipmentSlotIds,
      relatedLocationIds,
      relatedCurrencyIds,
    });
  }
}

export class ItemAction extends ItemActionOption {
  private readonly _type: ItemActionType;

  constructor({
    type,
    code,
    name,
    isVisibleWhenIdle,
    animationId,
    duration,
    cooldown,
    cooldownResetAt,
    amountSelectable,
    defaultAmount,
    parameters,
    relatedItemIds,
    relatedEquipmentSlotIds,
    relatedLocationIds,
    relatedCurrencyIds,
  }: {
    type: ItemActionType;
    code: string;
    name: string;
    isVisibleWhenIdle: boolean;
    animationId?: string;
    duration?: number;
    cooldown?: number;
    cooldownResetAt?: Date;
    amountSelectable: boolean;
    defaultAmount?: number;
    parameters?: Record<string, string>;
    relatedItemIds?: Set<string>;
    relatedEquipmentSlotIds?: Set<string>;
    relatedLocationIds?: Set<string>;
    relatedCurrencyIds?: Set<string>;
  }) {
    super({
      id: `${type}:${code}`,
      code,
      name,
      isVisibleWhenIdle,
      animationId,
      duration,
      cooldown,
      cooldownResetAt,
      amountSelectable,
      defaultAmount,
      parameters,
      relatedItemIds,
      relatedEquipmentSlotIds,
      relatedLocationIds,
      relatedCurrencyIds,
    });

    this._type = type;
  }

  get type(): ItemActionType {
    return this._type;
  }
}
