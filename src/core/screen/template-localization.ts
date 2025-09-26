import { TemplateConfigTranslation, TemplateTextTranslation } from '@roleplayx/engine-sdk';

import { TemplateConfiguration } from './template-configuration';

export interface TemplateLocalizationSettings<
  ITemplateLocalization extends TemplateTextLocalization,
  ITemplateConfiguration extends TemplateConfiguration,
> {
  [locale: string]: {
    TEXTS: ITemplateLocalization;
    CONFIGURATION: {
      [K in keyof ITemplateConfiguration]: TemplateConfigTranslation;
    };
  };
}

export interface TemplateTextLocalization {
  [key: string]: TemplateTextTranslation;
}
