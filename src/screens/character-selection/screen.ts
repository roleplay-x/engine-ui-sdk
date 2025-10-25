import {
  Character,
  CharacterGender,
  CharacterNationality,
  CharacterSummary,
  CreateMyCharacterRequest,
  PlayerApi,
} from '@roleplayx/engine-sdk';

import { Screen, ScreenDataPayload, ScreenMode, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';
import { ScreenClientEvents } from '../../core/shell/events/screen-client-events';
import { GamemodeSessionApi } from '../../gamemode/session/api';

import { CharacterSelectionScreenConfiguration } from './configuration';

export type CharacterSelectionScreenEvents = ScreenEvents;

export interface CharacterSelectionClientEvents extends ScreenClientEvents {
  characterPreview: { characterId: string };
}

export interface CharacterLinkOptions {
  showLoading: boolean;
  loadingText?: string;
}

export class CharacterSelectionScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<
  CharacterSelectionScreenEvents,
  CharacterSelectionScreenConfiguration,
  TLocalization,
  TConfiguration
> {
  private _characterSummaries: CharacterSummary[] | undefined;
  private _charactersCount: number | undefined;
  private _maxCharactersCount: number | undefined;
  private _genders: ReadonlyArray<CharacterGender> | undefined;
  private _nationalities: ReadonlyArray<CharacterNationality> | undefined;

  private _enginePlayerApi: PlayerApi | undefined;
  private _gamemodeSessionApi: GamemodeSessionApi | undefined;

  constructor(defaultSettings: ScreenSettings<TLocalization, TConfiguration>) {
    super(ScreenType.CharacterSelection, defaultSettings);
  }

  protected override async onInit({ mode, data }: { mode: ScreenMode; data?: ScreenDataPayload }) {
    this._enginePlayerApi = new PlayerApi(this.engineClient);
    this._gamemodeSessionApi = new GamemodeSessionApi(this.gamemodeClient);
    this.screenConfiguration = this.mapConfiguration();

    const [nationalities, genders] = await Promise.all([
      this._enginePlayerApi.getCharacterNationalities(),
      this._enginePlayerApi.getCharacterGenders(),
      this.loadAccount(),
    ]);

    this._nationalities = nationalities;
    this._genders = genders;
    return super.onInit({ mode, data });
  }

  public async createCharacter(request: CreateMyCharacterRequest): Promise<Character> {
    if (!this._enginePlayerApi) {
      throw new Error('Screen is not initialized');
    }

    const character = await this._enginePlayerApi.createMyCharacter(request);
    await this.loadAccount();
    return character;
  }

  public characterPreview(characterId: string) {
    this.emitToClient<CharacterSelectionClientEvents, 'characterPreview'>('characterPreview', {
      characterId,
    });
  }

  public async selectCharacter(characterId: string, options?: CharacterLinkOptions) {
    try {
      if (options?.showLoading) {
        this.showLoading(options?.loadingText);
      }

      await this._gamemodeSessionApi?.linkCharacterToSession({ characterId });
    } catch (err) {
      if (options?.showLoading) {
        this.hideLoading();
      }

      throw err;
    }
  }

  get characterSummaries(): ReadonlyArray<CharacterSummary> {
    if (!this._characterSummaries) {
      throw new Error('Screen is not initialized');
    }

    return this._characterSummaries;
  }

  get charactersCount(): number {
    if (this._charactersCount === undefined) {
      throw new Error('Screen is not initialized');
    }

    return this._charactersCount;
  }

  get maxCharactersCount(): number {
    if (this._maxCharactersCount === undefined) {
      throw new Error('Screen is not initialized');
    }

    return this._maxCharactersCount;
  }

  get genders(): ReadonlyArray<CharacterGender> {
    if (!this._genders) {
      throw new Error('Screen is not initialized');
    }

    return this._genders;
  }

  get nationalities(): ReadonlyArray<CharacterNationality> {
    if (!this._nationalities) {
      throw new Error('Screen is not initialized');
    }

    return this._nationalities;
  }

  protected hideLoadingOnLoad(): boolean {
    return true;
  }

  private async loadAccount() {
    const [accountSummary, characterSummaries] = await Promise.all([
      this._enginePlayerApi?.getMyAccountSummary(),
      this._enginePlayerApi?.getMyCharacterSummaries(),
    ]);
    this._maxCharactersCount = accountSummary?.maxCharacters;
    this._charactersCount = accountSummary?.charactersCount;
    this._characterSummaries = characterSummaries;
  }

  private mapConfiguration(): CharacterSelectionScreenConfiguration {
    return {
      nationalitySelectionEnabled: this.serverConfiguration.CHARACTER_NATIONALITY_ENABLED.value,
      inGameCharacterCreationEnabled:
        this.serverConfiguration.CHARACTER_IN_GAME_CREATION_ENABLED.value,
      minCharacterAge: this.serverConfiguration.CHARACTER_MIN_AGE.value,
      maxCharacterAge: this.serverConfiguration.CHARACTER_MAX_AGE.value,
      minCharacterFirstNameLength: this.serverConfiguration.CHARACTER_FIRST_NAME_MIN_LENGTH.value,
      maxCharacterFirstNameLength: this.serverConfiguration.CHARACTER_FIRST_NAME_MAX_LENGTH.value,
      minCharacterLastNameLength: this.serverConfiguration.CHARACTER_LAST_NAME_MIN_LENGTH.value,
      maxCharacterLastNameLength: this.serverConfiguration.CHARACTER_LAST_NAME_MAX_LENGTH.value,
      characterFullNameValidationPattern:
        this.serverConfiguration.CHARACTER_FULL_NAME_VALIDATION_PATTERN.value.expression,
    };
  }
}
