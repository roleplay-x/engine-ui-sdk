import { Toast } from '../../screens/toaster/screen';
import { CharacterRendered } from '../../screens/character-appearance/screen';

import { ScreenType } from './screen-type';

export type ScreenNotification =
  | {
      screen: ScreenType.Toaster;
      type: 'toast';
      data: Toast;
    }
  | {
      screen: ScreenType.CharacterAppearance;
      type: 'characterRendered';
      data: CharacterRendered;
    };
