export type LiveMessage = {
  id: string;
  author: string;
  text: string;
  at: number;
};

export type LiveState = {
  isLive: boolean;
  title: string;
  channel: string;
  startedAt: number | null;
  messages: LiveMessage[];
};

export type LiveEvent =
  | { type: "state"; payload: LiveState }
  | { type: "message"; payload: LiveMessage };
