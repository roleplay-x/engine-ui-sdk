import {
  AttachmentPoint,
  ComponentType,
  Currency,
  EquipmentSlot,
  EquipmentSlotTarget,
  ItemCategory,
  LedgerAccount,
  Localization,
  PlayerApi,
} from '@roleplayx/engine-sdk';
import _ from 'lodash';

import { Screen, ScreenDataPayload, ScreenMode, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';
import { GamemodeInventoryApi } from '../../gamemode/inventory/api';

import { InventoryItem } from './models/item';
import { Container } from './models/container';
import { ItemActionMenuFactory } from './models/factories/item-action-menu.factory';
import { ItemActionMenu } from './models/item-action-menu';

export type InventoryScreenEvents = ScreenEvents;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InventoryScreenConfiguration {}

export class InventoryScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<
  InventoryScreenEvents,
  InventoryScreenConfiguration,
  TLocalization,
  TConfiguration
> {
  private _enginePlayerApi: PlayerApi | undefined;
  private _gamemodeInventoryApi: GamemodeInventoryApi | undefined;
  private _itemActionMenuFactory: ItemActionMenuFactory | undefined;
  private _itemCategories: ReadonlyArray<ItemCategory> | undefined;
  private _equipmentSlots: ReadonlyArray<EquipmentSlot> | undefined;
  private _attachmentPoints: ReadonlyArray<AttachmentPoint> | undefined;
  private _currencies: ReadonlyArray<Currency> | undefined;
  private _items: Map<string, InventoryItem> | undefined;
  private _equippedItemIds: Set<string> | undefined;
  private _containedItemIds: Set<string> | undefined;
  private _containers: ReadonlyArray<Container> | undefined;
  private _ledgerAccount: LedgerAccount | undefined;

  constructor(
    defaultSettings: ScreenSettings<TLocalization, TConfiguration>,
    serverLocalizationSections?: ReadonlyArray<keyof Localization[string]>,
  ) {
    super(ScreenType.Inventory, defaultSettings, [
      'inventory',
      'texts',
      ...(serverLocalizationSections ?? []),
    ]);
  }

  protected override async onInit({ mode, data }: { mode: ScreenMode; data?: ScreenDataPayload }) {
    this._enginePlayerApi = new PlayerApi(this.engineClient);
    this._gamemodeInventoryApi = new GamemodeInventoryApi(this.gamemodeClient);
    this.screenConfiguration = {};
    this._itemCategories = await this._enginePlayerApi.getItemCategories();
    this._equipmentSlots = await this._enginePlayerApi.getEquipmentSlots({
      target: EquipmentSlotTarget.Character,
    });
    this._attachmentPoints = await this._enginePlayerApi.getAttachmentPoints();
    this._currencies = await this._enginePlayerApi.getCurrencies();
    this._ledgerAccount = await this._enginePlayerApi.getMyLedgerAccount();
    this._itemActionMenuFactory = new ItemActionMenuFactory(this.serverTranslator);
    await this.loadItems();
    return super.onInit({ mode, data });
  }

  get ledgerAccount(): LedgerAccount {
    if (!this._ledgerAccount) {
      throw new Error('Screen is not initialized');
    }

    return this._ledgerAccount;
  }

  get itemCategories(): ReadonlyArray<ItemCategory> {
    if (!this._itemCategories) {
      throw new Error('Screen is not initialized');
    }

    return this._itemCategories;
  }

  get attachmentPoints(): ReadonlyArray<AttachmentPoint> {
    if (!this._attachmentPoints) {
      throw new Error('Screen is not initialized');
    }

    return this._attachmentPoints;
  }

  get equipmentSlots(): ReadonlyArray<EquipmentSlot> {
    if (!this._equipmentSlots) {
      throw new Error('Screen is not initialized');
    }

    return this._equipmentSlots;
  }

  get currencies(): ReadonlyArray<Currency> {
    if (!this._currencies) {
      throw new Error('Screen is not initialized');
    }

    return this._currencies;
  }

  get containers(): ReadonlyArray<Container> {
    if (!this._containers) {
      throw new Error('Screen is not initialized');
    }

    return this._containers;
  }

  public getEquippedItems(): ReadonlyArray<InventoryItem> {
    if (!this._equippedItemIds || !this._items) {
      throw new Error('Screen is not initialized');
    }

    const items: InventoryItem[] = [];
    for (const itemId of this._equippedItemIds.values()) {
      const item = this._items.get(itemId);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  public getContainedItems(): ReadonlyArray<InventoryItem> {
    if (!this._containedItemIds || !this._items) {
      throw new Error('Screen is not initialized');
    }

    const items: InventoryItem[] = [];
    for (const itemId of this._containedItemIds.values()) {
      const item = this._items.get(itemId);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  public getItemActionMenu(itemId: string): ItemActionMenu {
    if (!this._items || !this._itemActionMenuFactory) {
      throw new Error('Screen is not initialized');
    }

    const item = this._items.get(itemId);
    if (!item) {
      return new ItemActionMenu([]);
    }

    return this._itemActionMenuFactory.create({
      item,
      equippedItems: this.getEquippedItems(),
      containers: this.containers,
      containedItems: this.getContainedItems(),
      equipmentSlots: this.equipmentSlots,
    });
  }

  private async loadItems() {
    const equippedItems = await this.gamemodeInventoryApi.getItems();
    this._containers = equippedItems
      .filter((p) => p.components.some((component) => component.type === ComponentType.Container))
      .map((item) => new Container(item));

    const items = equippedItems.map((p) => new InventoryItem(p));
    const childItems = await this.fetchChildItems(items);
    this._equippedItemIds = new Set(equippedItems.map((item) => item.id));
    this._containedItemIds = new Set(childItems.map((p) => p.id));

    this._items = new Map();
    [...items, ...childItems].forEach((item) => {
      this._items!.set(item.id, item);
    });
  }

  private async fetchChildItems(
    items: ReadonlyArray<InventoryItem>,
    iteration = 1,
  ): Promise<ReadonlyArray<InventoryItem>> {
    const chunks = _.chunk(
      items.filter((p) => p.supportsChildItems()).map((item) => item.id),
      50,
    );

    let childItems: InventoryItem[] = [];
    for (const parentItemIds of chunks) {
      childItems.push(
        ...(await this.gamemodeInventoryApi.getItems({ parentItemIds })).map(
          (item) => new InventoryItem(item),
        ),
      );
    }

    if (childItems.length && iteration < 10) {
      childItems = [...childItems, ...(await this.fetchChildItems(childItems, iteration + 1))];
    }

    return childItems;
  }

  private get enginePlayerApi(): PlayerApi {
    if (!this._enginePlayerApi) {
      throw new Error('Screen is not initialized');
    }
    return this._enginePlayerApi;
  }

  private get gamemodeInventoryApi(): GamemodeInventoryApi {
    if (!this._gamemodeInventoryApi) {
      throw new Error('Screen is not initialized');
    }
    return this._gamemodeInventoryApi;
  }

  protected override hiddenOnFirstLoad(): boolean {
    return true;
  }
}
