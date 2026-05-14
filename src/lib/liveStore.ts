type LiveMessage = {
  id: string;
  author: string;
  text: string;
  at: number;
};

type LiveState = {
  isLive: boolean;
  title: string;
  channel: string;
  startedAt: number | null;
  messages: LiveMessage[];
};

type Listener = (event: { type: "state" | "message"; payload: unknown }) => void;

const MAX_MESSAGES = 100;

class LiveStore {
  private state: LiveState = {
    isLive: false,
    title: "오늘의 라이브",
    channel: "film-live-room",
    startedAt: null,
    messages: [],
  };

  private listeners = new Set<Listener>();
  private scriptTimer: NodeJS.Timeout | null = null;

  getState() {
    return this.state;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  startLive(title?: string) {
    this.state = {
      ...this.state,
      title: title?.trim() || this.state.title,
      isLive: true,
      startedAt: Date.now(),
    };
    this.emit({ type: "state", payload: this.state });
  }

  stopLive() {
    this.state = {
      ...this.state,
      isLive: false,
      startedAt: null,
    };
    if (this.scriptTimer) {
      clearTimeout(this.scriptTimer);
      this.scriptTimer = null;
    }
    this.emit({ type: "state", payload: this.state });
  }

  pushMessage(author: string, text: string) {
    const message: LiveMessage = {
      id: crypto.randomUUID(),
      author,
      text,
      at: Date.now(),
    };
    this.state = {
      ...this.state,
      messages: [...this.state.messages, message].slice(-MAX_MESSAGES),
    };
    this.emit({ type: "message", payload: message });
  }

  startScript(messages: Array<{ author: string; text: string }>, intervalMs: number) {
    if (!messages.length) return;
    if (this.scriptTimer) {
      clearTimeout(this.scriptTimer);
      this.scriptTimer = null;
    }

    let index = 0;
    const pushNext = () => {
      if (index >= messages.length) {
        this.scriptTimer = null;
        return;
      }

      const current = messages[index];
      this.pushMessage(current.author, current.text);
      index += 1;
      this.scriptTimer = setTimeout(pushNext, intervalMs);
    };

    pushNext();
  }

  private emit(event: { type: "state" | "message"; payload: unknown }) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

const globalForLive = globalThis as unknown as { liveStore?: LiveStore };

export const liveStore = globalForLive.liveStore ?? new LiveStore();
if (!globalForLive.liveStore) {
  globalForLive.liveStore = liveStore;
}
