class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  private listeners: Set<(ev: MessageEvent) => void> = new Set();
  static channels: Map<string, Set<MockBroadcastChannel>> = new Map();

  constructor(name: string) {
    this.name = name;
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name)!.add(this);
  }

  postMessage(message: any) {
    const channels = MockBroadcastChannel.channels.get(this.name);
    if (channels) {
      channels.forEach((ch) => {
        if (ch !== this) {
          const event = new MessageEvent('message', { data: message });
          if (ch.onmessage) {
            ch.onmessage(event);
          }
          ch.listeners.forEach((listener) => listener(event));
        }
      });
    }
  }

  addEventListener(type: string, listener: (ev: MessageEvent) => void) {
    if (type === 'message') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type: string, listener: (ev: MessageEvent) => void) {
    if (type === 'message') {
      this.listeners.delete(listener);
    }
  }

  close() {
    const channels = MockBroadcastChannel.channels.get(this.name);
    if (channels) {
      channels.delete(this);
    }
  }
}

globalThis.BroadcastChannel = MockBroadcastChannel as any;
