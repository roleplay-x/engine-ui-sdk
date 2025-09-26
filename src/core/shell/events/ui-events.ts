import { ScreenType } from '../../screen/screen-type';
import { ScreenNotification } from '../../screen/screen-notification';

export interface UIEvents {
  'screen:readyToInitialize': { screen: ScreenType };
  'screen:initialized': { screen: ScreenType; templateId: string };
  'screen:changeLocale': { fromScreen: ScreenType; locale: string };
  'screen:error': { error: string; details?: unknown };
  'screen:navigation': { fromScreen: ScreenType; toScreen: ScreenType; params?: unknown };
  'screen:notifyScreen': ScreenNotification;
}
