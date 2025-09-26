import { Screen, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';

export type Toast = {
  type: 'INFO' | 'ERROR' | 'WARN';
  title: string;
  message: string;
};

export type ToasterScreenEvents = ScreenEvents & { toast: Toast };

export class ToasterScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<ToasterScreenEvents, TLocalization, TConfiguration> {
  constructor(defaultSettings: ScreenSettings<TLocalization, TConfiguration>) {
    super(ScreenType.Toaster, defaultSettings);
  }
}
