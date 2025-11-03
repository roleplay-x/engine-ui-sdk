import {
  BaseBlueprintConfigValue,
  BlueprintConfig,
  BlueprintConfigSection,
  BlueprintConfigType,
  EngineError,
  mapBlueprintConfigValue,
  mapBlueprintConfigValues,
  PlayerApi,
} from '@roleplayx/engine-sdk';

import { Screen, ScreenDataPayload, ScreenMode, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';
import { ScreenClientEvents } from '../../core/shell/events/screen-client-events';
import { GamemodeCharacterApi } from '../../gamemode/character/api';

export type CharacterRendered = {
  base64Image?: string;
};

export type CharacterAppearanceSaveFailed = {
  error: string;
};

export type CharacterAppearanceScreenEvents = ScreenEvents & {
  characterRendered: CharacterRendered;
  saveFailed: CharacterAppearanceSaveFailed;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CharacterAppearanceScreenConfiguration {}

export interface CharacterAppearanceClientEvents extends ScreenClientEvents {
  characterAppearancePreview: { values: BaseBlueprintConfigValue[] };
  characterRenderRequested: { values: BaseBlueprintConfigValue[] };
  sectionSelected: { key: string };
}

export interface CharacterAppearanceSaveOptions {
  showLoading: boolean;
  loadingText?: string;
}

export class CharacterAppearanceScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<
  CharacterAppearanceScreenEvents,
  CharacterAppearanceScreenConfiguration,
  TLocalization,
  TConfiguration
> {
  private _sections: ReadonlyArray<BlueprintConfigSection> | undefined;
  private _configs: Map<string, BlueprintConfig> | undefined;
  private _appearanceValues: BaseBlueprintConfigValue[] | undefined;
  private _initialAppearanceData: Record<string, string> | undefined;
  private _appearanceData: Record<string, string> | undefined;
  private _saveOptions: CharacterAppearanceSaveOptions | undefined;

  private _enginePlayerApi: PlayerApi | undefined;
  private _gamemodeCharacterApi: GamemodeCharacterApi | undefined;

  constructor(defaultSettings: ScreenSettings<TLocalization, TConfiguration>) {
    super(ScreenType.CharacterAppearance, defaultSettings);
    this.on('characterRendered', this.onCharacterRendered.bind(this));
  }

  protected override async onInit({ mode, data }: { mode: ScreenMode; data?: ScreenDataPayload }) {
    this._enginePlayerApi = new PlayerApi(this.engineClient);
    this._gamemodeCharacterApi = new GamemodeCharacterApi(this.gamemodeClient);
    this.screenConfiguration = {};
    await this.loadConfiguration();
    return super.onInit({ mode, data });
  }

  public selectSection(key: string) {
    this.emitToClient<CharacterAppearanceClientEvents, 'sectionSelected'>('sectionSelected', {
      key,
    });
  }

  public changeValue(configKey: string, valueKey: string) {
    const config = this.configs.get(configKey);
    if (!config) {
      throw new Error(`Invalid config key ${configKey}`);
    }

    const value = mapBlueprintConfigValue(config, valueKey);
    if (!value) {
      throw new Error(`Invalid value key ${valueKey} for ${configKey} config`);
    }

    this.appearanceData[configKey] = valueKey;
    this._appearanceValues = this.appearanceValues.filter((p) => p.configKey !== configKey);
    this._appearanceValues.push(value);

    this.emitToClient<CharacterAppearanceClientEvents, 'characterAppearancePreview'>(
      'characterAppearancePreview',
      {
        values: [value],
      },
    );
  }

  public reset() {
    this._appearanceData = { ...this.initialAppearanceData };
    this._appearanceValues = mapBlueprintConfigValues(this.configs, this._appearanceData);
    this.emitToClient<CharacterAppearanceClientEvents, 'characterAppearancePreview'>(
      'characterAppearancePreview',
      {
        values: this._appearanceValues,
      },
    );
  }

  public save(options?: CharacterAppearanceSaveOptions) {
    this._saveOptions = options;
    this.emitToClient<CharacterAppearanceClientEvents, 'characterRenderRequested'>(
      'characterRenderRequested',
      {
        values: this.appearanceValues,
      },
    );
  }

  public get appearanceData(): Record<string, string> {
    if (!this._appearanceData) {
      throw new Error('Screen is not initialized');
    }
    return this._appearanceData;
  }

  public get sections(): ReadonlyArray<BlueprintConfigSection> {
    if (!this._sections) {
      throw new Error('Screen is not initialized');
    }
    return this._sections;
  }

  private async onCharacterRendered(payload: CharacterRendered) {
    try {
      if (this._saveOptions?.showLoading) {
        this.showLoading(this._saveOptions.loadingText);
      }

      await this.gamemodeCharacterApi.updateCharacterAppearance({
        data: this.appearanceData,
        base64Image: payload.base64Image,
      });
    } catch (error) {
      if (this._saveOptions?.showLoading) {
        this.hideLoading();
      }

      if (error instanceof EngineError) {
        this.emit('saveFailed', { error: error.message });
        return;
      }

      this.emit('saveFailed', { error: 'Something went wrong while saving the profile.' });
      console.error('saveFailed', error);
    }
  }

  private get appearanceValues(): BaseBlueprintConfigValue[] {
    if (!this._appearanceValues) {
      throw new Error('Screen is not initialized');
    }
    return this._appearanceValues;
  }

  private get initialAppearanceData(): Record<string, string> {
    if (!this._initialAppearanceData) {
      throw new Error('Screen is not initialized');
    }
    return this._initialAppearanceData;
  }

  private get configs(): Map<string, BlueprintConfig> {
    if (!this._configs) {
      throw new Error('Screen is not initialized');
    }
    return this._configs;
  }

  private async loadConfiguration() {
    const [character, sections] = await Promise.all([
      this.enginePlayerApi.getMyCurrentCharacter(),
      this.enginePlayerApi.getMyCurrentCharacterAppearanceSections(),
    ]);

    this._sections = this.getSections(sections);
    const configs = this._sections.flatMap((p) => this.getSectionConfigs(p));

    this._configs = configs.reduce((acc, config) => {
      if (!config) {
        return acc;
      }
      return acc.set(config.key, config);
    }, new Map<string, BlueprintConfig>());

    this._initialAppearanceData = this.getInitialData(character.appearance?.data, configs);
    this._appearanceData = { ...this._initialAppearanceData };
    this._appearanceValues = mapBlueprintConfigValues(this._configs, this._appearanceData);

    this.emitToClient<CharacterAppearanceClientEvents, 'characterAppearancePreview'>(
      'characterAppearancePreview',
      {
        values: this._appearanceValues,
      },
    );
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

  private getInitialData(data: Record<string, string> | undefined, configs: BlueprintConfig[]) {
    const initialData = data ?? {};
    const sliderConfigs = configs.filter((p) => p.type === BlueprintConfigType.Slider);
    sliderConfigs.forEach((config) => {
      if (!initialData[config.key]) {
        const value =
          (config.parameters.slider?.max ?? 0) - (config.parameters.slider?.min ?? 0) / 2;

        initialData[config.key] = Math.max(value, 0).toString();
      }
    });
    return initialData;
  }

  private getSections(
    sections: ReadonlyArray<BlueprintConfigSection>,
  ): ReadonlyArray<BlueprintConfigSection> {
    return sections
      .filter((section) => section.visible)
      .map((section) => ({
        ...section,
        subSections: this.getSections(section.subSections ?? []),
      }));
  }

  private getSectionConfigs(section: BlueprintConfigSection): BlueprintConfig[] {
    const configs = section.configs ?? [];
    const subConfigs =
      section.subSections?.flatMap((subSection) => this.getSectionConfigs(subSection)) ?? [];
    return [...configs, ...subConfigs];
  }

  protected override hideLoadingOnLoad(): boolean {
    return true;
  }
}
