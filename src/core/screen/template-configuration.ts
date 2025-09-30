import {
  ConfigSelectOptionValue,
  ConfigTypeValueMap,
  ServerTemplateConfigType,
} from '@roleplayx/engine-sdk';

export interface TemplateConfig<T extends ServerTemplateConfigType> {
  /**
   *
   * @type {T}
   * @memberof TemplateConfig
   */
  type: T;
  /**
   *
   * @type {ConfigTypeValueMap[T]}
   * @memberof TemplateConfig
   */
  value: ConfigTypeValueMap[T];
}

export interface TemplateConfigurationTextConstraint {
  minLength?: number;
  maxLength?: number;
}

export interface TemplateConfigurationIntegerConstraint {
  min?: number;
  max?: number;
}

export interface TemplateConfigurationDecimalConstraint {
  min?: number;
  max?: number;
}

export interface TemplateConfigurationImageConstraint {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  ratio?: number;
  required?: boolean;
}

export interface TemplateConfigurationConstraint {
  text?: TemplateConfigurationTextConstraint;
  integer?: TemplateConfigurationDecimalConstraint;
  decimal?: TemplateConfigurationIntegerConstraint;
  image?: TemplateConfigurationImageConstraint;
}

export interface TemplateConfigSetting<T extends ServerTemplateConfigType>
  extends TemplateConfig<T> {
  /**
   *
   * @type {ConfigSelectOptionValue[]}
   * @memberof TemplateConfigSetting
   */
  options?: ConfigSelectOptionValue[];
  /**
   *
   * @type {TemplateConfigurationConstraint}
   * @memberof TemplateConfigSetting
   */
  constraints?: TemplateConfigurationConstraint;
}

/**
 * Interface for template configuration containing all possible config keys
 * @export
 * @interface TemplateConfiguration
 */
export interface TemplateConfiguration {
  [key: string]: TemplateConfig<ServerTemplateConfigType>;
}

/**
 * Interface for template configuration settings containing all possible config keys
 * @export
 * @type TemplateConfigurationSettings
 */
export type TemplateConfigurationSettings<T extends TemplateConfiguration> = {
  [K in keyof T]: TemplateConfigSetting<ServerTemplateConfigType>;
};
