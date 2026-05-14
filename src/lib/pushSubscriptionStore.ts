import type { PushSubscription } from "web-push";

class PushSubscriptionStore {
  private map = new Map<string, PushSubscription>();

  add(sub: PushSubscription) {
    if (!sub?.endpoint) return;
    this.map.set(sub.endpoint, sub);
  }

  remove(endpoint: string) {
    this.map.delete(endpoint);
  }

  getAll(): PushSubscription[] {
    return [...this.map.values()];
  }

  get size() {
    return this.map.size;
  }
}

const g = globalThis as unknown as { __liveappPushSubs?: PushSubscriptionStore };

export const pushSubStore = g.__liveappPushSubs ?? new PushSubscriptionStore();
if (!g.__liveappPushSubs) {
  g.__liveappPushSubs = pushSubStore;
}
