export interface CharacterSelectionScreenConfiguration {
  nationalitySelectionEnabled: boolean;
  inGameCharacterCreationEnabled: boolean;
  minCharacterAge: number;
  maxCharacterAge: number;
  minCharacterFirstNameLength: number;
  maxCharacterFirstNameLength: number;
  minCharacterLastNameLength: number;
  maxCharacterLastNameLength: number;
  characterFullNameValidationPattern: string;
}
