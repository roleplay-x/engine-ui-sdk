import { ScreenType } from '../screen-type';
import { TemplateTextLocalization } from '../template-localization';

export interface ScreenEvents {
  init: { screen: ScreenType };
  localeChanged: { locale: string; localization: TemplateTextLocalization };
}
