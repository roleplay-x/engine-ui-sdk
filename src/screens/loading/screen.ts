import { Screen, ScreenDataPayload, ScreenMode, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';

export interface LoadingScreenDataPayload {
  text: string;
}

export type LoadingTextChanged = {
  text: string;
};

export type LoadingScreenEvents = ScreenEvents & { textChanged: LoadingTextChanged };

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LoadingScreenConfiguration {}

export class LoadingScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<LoadingScreenEvents, LoadingScreenConfiguration, TLocalization, TConfiguration> {
  private _text: string = '';

  constructor(defaultSettings: ScreenSettings<TLocalization, TConfiguration>) {
    super(ScreenType.Loading, defaultSettings);
  }

  protected override onInit({ mode, data }: { mode: ScreenMode; data?: ScreenDataPayload }) {
    if (data) {
      const loadingData = data as LoadingScreenDataPayload;
      this._text = loadingData.text || '';
    }

    return super.onInit({ mode, data });
  }

  protected override onDataUpdated(data: ScreenDataPayload): void | Promise<void> {
    const loadingData = data as LoadingScreenDataPayload;
    this._text = loadingData.text ?? '';
    this.emit('textChanged', { text: this._text });
    return super.onDataUpdated(data);
  }

  get text(): string {
    return this._text;
  }

  protected hideLoadingOnLoad(): boolean {
    return false;
  }
}
