import { ScreenType } from '../screen-type';
import { TemplateTextLocalization } from '../template-localization';
import { ScreenCallbackPayload, ScreenMode } from '../screen';

export interface ScreenEvents {
  init: { screen: ScreenType; mode: ScreenMode };
  callback: { screen: ScreenType; type: string; data?: ScreenCallbackPayload };
  localeChanged: { locale: string; localization: TemplateTextLocalization };
}
