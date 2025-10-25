import { SessionContext } from '../context/context';
import { UIEventEmitter } from '../events/event-emitter';
import { ScreenType } from '../screen/screen-type';

import {
  ShellCallbackScreen,
  ShellEvents,
  ShellInitializeScreen,
  ShellLocaleChanged,
  ShellUpdateScreenData,
} from './events/shell-events';
import { ScreenShellEvents } from './events/screen-shell-events';
import { ScreenClientEvents } from './events/screen-client-events';

export class ShellBridge {
  private shellEmitter: UIEventEmitter<ShellEvents>;
  private sessionContext: SessionContext | null = null;
  private isInitialized = false;

  constructor(protected screen: ScreenType) {
    this.shellEmitter = new UIEventEmitter<ShellEvents>();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('shell:initializeScreen', this.onInitialize.bind(this));
    window.addEventListener('shell:callbackScreen', this.onCallback.bind(this));
    window.addEventListener('shell:updateScreenData', this.onDataUpdated.bind(this));
    window.addEventListener('shell:localeChanged', this.onLocaleChanged.bind(this));
  }

  private onInitialize(event: Event) {
    const customEvent = event as CustomEvent<ShellInitializeScreen>;
    return this.handleShellInitialize(customEvent.detail);
  }

  private onCallback(event: Event) {
    const customEvent = event as CustomEvent<ShellCallbackScreen>;
    return this.handleShellCallback(customEvent.detail);
  }

  private onDataUpdated(event: Event) {
    const customEvent = event as CustomEvent<ShellUpdateScreenData>;
    return this.handleShellDataUpdated(customEvent.detail);
  }

  private onLocaleChanged(event: Event) {
    const customEvent = event as CustomEvent<ShellLocaleChanged>;
    return this.handleShellLocaleChanged(customEvent.detail);
  }

  private handleShellInitialize({
    screen,
    context,
    localization,
    templateConfiguration,
    serverConfiguration,
    locales,
    defaultLocale,
    locale,
    mode,
    data,
    callback,
  }: ShellInitializeScreen) {
    if (screen !== this.screen) {
      return;
    }

    this.sessionContext = context;
    this.isInitialized = true;
    this.shellEmitter.emit('shell:initializeScreen', {
      screen: this.screen,
      context,
      localization,
      templateConfiguration,
      serverConfiguration,
      locales,
      defaultLocale,
      locale,
      mode,
      data,
      callback,
    });
  }

  private handleShellCallback({ screen, type, payload }: ShellCallbackScreen) {
    if (screen !== this.screen) {
      return;
    }

    this.shellEmitter.emit('shell:callbackScreen', {
      screen: this.screen,
      type,
      payload,
    });
  }

  private handleShellDataUpdated({ screen, data }: ShellUpdateScreenData) {
    if (screen !== this.screen) {
      return;
    }

    this.shellEmitter.emit('shell:updateScreenData', {
      screen: this.screen,
      data,
    });
  }

  private handleShellLocaleChanged(event: ShellLocaleChanged) {
    if (event.screen !== this.screen) {
      return;
    }

    if (this.sessionContext) {
      this.sessionContext.locale = event.locale;
    }

    this.shellEmitter.emit('shell:localeChanged', event);
  }

  emitToShell<E extends keyof ScreenShellEvents>(event: E, payload: ScreenShellEvents[E]) {
    const customEvent = new CustomEvent(event, {
      detail: payload,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(customEvent);

    window.parent.postMessage(
      {
        type: `${this.screen}:${event}`,
        payload,
      },
      '*',
    );
  }

  emitToClient<E extends ScreenClientEvents, K extends keyof E>(
    screen: ScreenType,
    event: K,
    payload: E[K],
  ) {
    const customEvent = new CustomEvent(`${screen}:${event as string}`, {
      detail: payload,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(customEvent);
  }

  onShellEvent<E extends keyof ShellEvents>(event: E, listener: (payload: ShellEvents[E]) => void) {
    this.shellEmitter.on(event, listener);
  }

  offShellEvent<E extends keyof ShellEvents>(
    event: E,
    listener?: (payload: ShellEvents[E]) => void,
  ) {
    this.shellEmitter.off(event, listener);
  }

  get context(): SessionContext | null {
    return this.sessionContext;
  }

  async getContext(): Promise<SessionContext> {
    if (this.sessionContext) {
      return this.sessionContext;
    }

    return new Promise((resolve) => {
      this.shellEmitter.once('shell:initializeScreen', ({ context }) => {
        resolve(context);
      });
    });
  }

  getContextSync(): SessionContext | null {
    return this.sessionContext;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
