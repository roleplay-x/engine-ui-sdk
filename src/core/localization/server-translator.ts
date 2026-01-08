import { ErrorTranslation, Localization, LocalizationData } from '@roleplayx/engine-sdk';

type HasIndexSignature<T> = string extends keyof T ? true : false;

type ExtractRecordValue<T> = T extends Record<string, infer V> ? V : never;

export type TopLevelSections = {
  [K in keyof LocalizationData]-?: HasIndexSignature<NonNullable<LocalizationData[K]>> extends true
    ? K
    : never;
}[keyof LocalizationData];

export type NestedSections = {
  [K in keyof LocalizationData]-?: HasIndexSignature<NonNullable<LocalizationData[K]>> extends true
    ? never
    : K;
}[keyof LocalizationData];

export type SubSectionKeys<K extends NestedSections> = keyof NonNullable<LocalizationData[K]>;

export type SubSectionItemType<
  K extends NestedSections,
  SK extends SubSectionKeys<K>,
> = SK extends keyof NonNullable<LocalizationData[K]>
  ? ExtractRecordValue<NonNullable<NonNullable<LocalizationData[K]>[SK]>>
  : never;

export type TopLevelItemType<K extends TopLevelSections> = ExtractRecordValue<
  NonNullable<LocalizationData[K]>
>;

export class ServerTranslator {
  private readonly _localization: Localization;

  constructor(localization: Localization) {
    this._localization = localization;
  }

  public translateExpression<K extends TopLevelSections>(
    sectionKey: K,
    key: string,
    selector: (item: TopLevelItemType<K>) => string,
    params: Record<string, string>,
  ): string;
  public translateExpression<K extends NestedSections, SK extends SubSectionKeys<K>>(
    sectionKey: K,
    subSectionKey: SK,
    key: string,
    selector: (item: SubSectionItemType<K, SK>) => string,
    params: Record<string, string>,
  ): string;
  public translateExpression(
    sectionKey: string,
    keyOrSubSection: string,
    selectorOrKey: ((item: Record<string, string>) => string) | string,
    paramsOrSelector: Record<string, string> | ((item: Record<string, string>) => string),
    params?: Record<string, string>,
  ): string {
    const topSection = this._localization[sectionKey as keyof typeof this._localization];
    if (!topSection) {
      return typeof selectorOrKey === 'string' ? selectorOrKey : keyOrSubSection;
    }

    if (typeof selectorOrKey === 'function') {
      const item = (topSection as Record<string, Record<string, string>>)[keyOrSubSection];
      if (!item) {
        return keyOrSubSection;
      }
      const expression = selectorOrKey(item);
      return this.buildExpression(expression, paramsOrSelector as Record<string, string>);
    }

    const subSection = (topSection as Record<string, Record<string, Record<string, string>>>)[
      keyOrSubSection
    ];
    if (!subSection) {
      return selectorOrKey;
    }

    const item = subSection[selectorOrKey];
    if (!item) {
      return selectorOrKey;
    }

    const selector = paramsOrSelector as (item: Record<string, string>) => string;
    const expression = selector(item);
    return this.buildExpression(expression, (params as Record<string, string>) ?? {});
  }

  public translateError(key: string, params: Record<string, string>): string {
    return this.translateExpression(
      'errors',
      key,
      (error: ErrorTranslation) => error.message,
      params,
    );
  }

  private buildExpression(expression: string, params: Record<string, string>): string {
    let result = expression;

    for (const [key, value] of Object.entries(params)) {
      const placeholder = `\${${key}}`;
      while (result.includes(placeholder)) {
        result = result.replace(placeholder, value);
      }
    }

    return result;
  }
}
