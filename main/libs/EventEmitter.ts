export class EventEmitter {
  private events: {
    [key: string]: { callback: Function; scope: any; once: boolean }[];
  } = {};

  destroy() {
    this.events = {};
  }

  on(
    event: string,
    callback: Function,
    scope: any = null,
    once: boolean = false
  ) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push({ callback, scope, once });
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) {
      return;
    }
    const events = this.events[event];
    this.events[event] = [];
    events.forEach((item) => {
      if (!item.once) {
        this.events[event]?.push(item);
      }
      item.callback.apply(item.scope, args);
    });
  }

  off(event: string, callback: Function, scope: any = null) {
    if (!this.events[event]) {
      return;
    }
    this.events[event] = this.events[event].filter(
      (item) => item.callback !== callback || item.scope !== scope
    );
  }

  once(event: string, callback: Function, scope: any = null) {
    this.on(event, callback, scope, true);
  }
}
