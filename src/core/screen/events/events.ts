import { ScreenType } from '../screen-type';
import { TemplateTextLocalization } from '../template-localization';
import { ScreenMode } from '../screen';

export interface ScreenEvents {
  init: { screen: ScreenType; mode: ScreenMode };
  localeChanged: { locale: string; localization: TemplateTextLocalization };
}
