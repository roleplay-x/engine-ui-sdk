import { ScreenType } from '../../screen/screen-type';
import { ScreenNotification } from '../../screen/screen-notification';

export interface ScreenShellEvents {
  'screen:readyToInitialize': { screen: ScreenType };
  'screen:initialized': {
    screen: ScreenType;
    templateId: string;
    hideLoading: boolean;
    hiddenOnFirstLoad: boolean;
  };
  'screen:changeLocale': { fromScreen: ScreenType; locale: string };
  'screen:showLoading': { fromScreen: ScreenType; text: string };
  'screen:hideLoading': { fromScreen: ScreenType };
  'screen:error': { error: string; details?: unknown };
  'screen:navigation': { fromScreen: ScreenType; toScreen: ScreenType; params?: unknown };
  'screen:notifyScreen': ScreenNotification;
}
