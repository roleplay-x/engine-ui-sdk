import { CharacterAnimation, CharacterAnimationCategory, PlayerApi } from '@roleplayx/engine-sdk';
import { PaginationQuery } from '@roleplayx/engine-sdk/common/pagination-query';
import { PaginatedItems } from '@roleplayx/engine-sdk/common/paginated-items';

import { Screen, ScreenDataPayload, ScreenMode, ScreenSettings } from '../../core/screen/screen';
import { ScreenType } from '../../core/screen/screen-type';
import { ScreenEvents } from '../../core/screen/events/events';
import { TemplateTextLocalization } from '../../core/screen/template-localization';
import { TemplateConfiguration } from '../../core/screen/template-configuration';
import { ScreenClientEvents } from '../../core/shell/events/screen-client-events';

export type AnimationMenuScreenEvents = ScreenEvents;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AnimationMenuScreenConfiguration {}

export interface AnimationMenuClientEvents extends ScreenClientEvents {
  bindAnimations: { animations: ReadonlyArray<CharacterAnimation> };
  playAnimation: { animation: CharacterAnimation };
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  enablePositionSelector: {};
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  pause: {};
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  repeat: {};
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  move: {};
}

export class AnimationMenuScreen<
  TLocalization extends TemplateTextLocalization,
  TConfiguration extends TemplateConfiguration,
> extends Screen<
  AnimationMenuScreenEvents,
  AnimationMenuScreenConfiguration,
  TLocalization,
  TConfiguration
> {
  private _enginePlayerApi: PlayerApi | undefined;
  private _animationCategories: ReadonlyArray<CharacterAnimationCategory> | undefined;

  constructor(defaultSettings: ScreenSettings<TLocalization, TConfiguration>) {
    super(ScreenType.AnimationMenu, defaultSettings);
  }

  protected override async onInit({ mode, data }: { mode: ScreenMode; data?: ScreenDataPayload }) {
    this._enginePlayerApi = new PlayerApi(this.engineClient);
    this.screenConfiguration = {};
    this._animationCategories = await this._enginePlayerApi.getMyAnimationCategories();
    return super.onInit({ mode, data });
  }

  public async getAnimations(
    query: {
      animationCategoryId?: string;
      key?: string;
      keyIn?: string;
      ids?: string;
    } & PaginationQuery,
  ): Promise<PaginatedItems<CharacterAnimation>> {
    const animations = await this.enginePlayerApi.getMyAnimations(query);
    if (animations.items.length) {
      this.emitToClient<AnimationMenuClientEvents, 'bindAnimations'>('bindAnimations', {
        animations: animations.items,
      });
    }
    return animations;
  }

  public playAnimation(animation: CharacterAnimation): void {
    this.emitToClient<AnimationMenuClientEvents, 'playAnimation'>('playAnimation', {
      animation,
    });
  }

  public pause(): void {
    this.emitToClient<AnimationMenuClientEvents, 'pause'>('pause', {});
  }

  public repeat(): void {
    this.emitToClient<AnimationMenuClientEvents, 'repeat'>('repeat', {});
  }

  public enablePositionSelector(): void {
    this.emitToClient<AnimationMenuClientEvents, 'enablePositionSelector'>(
      'enablePositionSelector',
      {},
    );
  }

  public move(): void {
    this.emitToClient<AnimationMenuClientEvents, 'move'>('move', {});
  }

  public get animationCategories(): ReadonlyArray<CharacterAnimationCategory> {
    if (!this._animationCategories) {
      throw new Error('Screen is not initialized');
    }
    return this._animationCategories;
  }

  private get enginePlayerApi(): PlayerApi {
    if (!this._enginePlayerApi) {
      throw new Error('Screen is not initialized');
    }
    return this._enginePlayerApi;
  }

  protected override hiddenOnFirstLoad(): boolean {
    return true;
  }
}
