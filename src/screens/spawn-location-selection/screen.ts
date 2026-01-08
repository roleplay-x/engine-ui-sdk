import { Localization, PlayerApi, SpawnLocation } from '@roleplayx/engine-sdk';

import { Screen, ScreenDataPayload, ScreenMode, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';
import { ScreenClientEvents } from '../../core/shell/events/screen-client-events';
import { GamemodeCharacterApi } from '../../gamemode/character/api';

export type SpawnLocationSelectionScreenEvents = ScreenEvents;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SpawnLocationSelectionScreenConfiguration {}

export interface SpawnLocationSelectionClientEvents extends ScreenClientEvents {
  spawnLocationPreview: { cameraId?: string };
}

export interface SpawnLocationSelectionSelectOptions {
  showLoading: boolean;
  loadingText?: string;
}

export class SpawnLocationSelectionScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<
  SpawnLocationSelectionScreenEvents,
  SpawnLocationSelectionScreenConfiguration,
  TLocalization,
  TConfiguration
> {
  private _spawnLocations: ReadonlyArray<SpawnLocation> | undefined;

  private _enginePlayerApi: PlayerApi | undefined;
  private _gamemodeCharacterApi: GamemodeCharacterApi | undefined;

  constructor(
    defaultSettings: ScreenSettings<TLocalization, TConfiguration>,
    serverLocalizationSections?: ReadonlyArray<keyof Localization[string]>,
  ) {
    super(ScreenType.SpawnLocationSelection, defaultSettings, serverLocalizationSections);
  }

  protected override async onInit({ mode, data }: { mode: ScreenMode; data?: ScreenDataPayload }) {
    this._enginePlayerApi = new PlayerApi(this.engineClient);
    this._gamemodeCharacterApi = new GamemodeCharacterApi(this.gamemodeClient);
    this.screenConfiguration = {};
    this._spawnLocations = await this.enginePlayerApi.getMySpawnLocations();
    return super.onInit({ mode, data });
  }

  public spawnLocationPreview(spawnLocationId: string) {
    const location = this._spawnLocations?.find((p) => p.id === spawnLocationId);
    if (!location) {
      return;
    }

    this.emitToClient<SpawnLocationSelectionClientEvents, 'spawnLocationPreview'>(
      'spawnLocationPreview',
      {
        cameraId: location.cameraId,
      },
    );
  }

  public async selectSpawnLocation(
    spawnLocationId: string,
    options?: SpawnLocationSelectionSelectOptions,
  ) {
    await this.gamemodeCharacterApi.spawnMyCharacter({ spawnLocationId });
    if (options?.showLoading) {
      this.showLoading(options?.loadingText);
    }
  }

  public get spawnLocations(): ReadonlyArray<SpawnLocation> {
    if (!this._spawnLocations) {
      throw new Error('Screen is not initialized');
    }
    return this._spawnLocations;
  }

  private get gamemodeCharacterApi(): GamemodeCharacterApi {
    if (!this._gamemodeCharacterApi) {
      throw new Error('Screen is not initialized');
    }
    return this._gamemodeCharacterApi;
  }

  private get enginePlayerApi(): PlayerApi {
    if (!this._enginePlayerApi) {
      throw new Error('Screen is not initialized');
    }
    return this._enginePlayerApi;
  }

  protected override hideLoadingOnLoad(): boolean {
    return true;
  }
}
