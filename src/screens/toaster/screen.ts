import { Screen, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';

export type Toast = {
  type: 'INFO' | 'ERROR' | 'WARN' | 'TIP';
  title: string;
  message: string;
};

export type ToasterScreenEvents = ScreenEvents & { toast: Toast };

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ToasterScreenConfiguration {}

export class ToasterScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<ToasterScreenEvents, ToasterScreenConfiguration, TLocalization, TConfiguration> {
  constructor(defaultSettings: ScreenSettings<TLocalization, TConfiguration>) {
    super(ScreenType.Toaster, defaultSettings);
  }

  protected hideLoadingOnLoad(): boolean {
    return false;
  }
}
