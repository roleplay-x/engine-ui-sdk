import { SessionContext } from '../context/context';
import { UIEventEmitter } from '../events/event-emitter';
import { ScreenType } from '../screen/screen-type';

import { ShellEvents, ShellInitializeScreen, ShellLocaleChanged } from './events/shell-events';
import { UIEvents } from './events/ui-events';

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
    window.addEventListener('shell:localeChanged', this.onLocaleChanged.bind(this));
  }

  private onInitialize(event: Event) {
    const customEvent = event as CustomEvent<ShellInitializeScreen>;
    return this.handleShellInitialize(customEvent.detail);
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

  emitToShell<E extends keyof UIEvents>(event: E, payload: UIEvents[E]) {
    const customEvent = new CustomEvent(event, {
      detail: payload,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(customEvent);

    // Also emit via postMessage (for cross-origin)
    window.parent.postMessage(
      {
        type: `UI:${this.screen}:${String(event).toUpperCase().replace(/-/g, '_')}`,
        payload,
      },
      '*',
    );
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
