import { Notification, NotificationType, ScoredNotification } from "../types/notification";

export const TYPE_WEIGHTS: Record<NotificationType, number> = {
  Placement: 100,
  Result: 70,
  Event: 40
};

export const DECAY_PER_MINUTE = 0.2;

class MinHeap<T> {
  private items: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) {
      return undefined;
    }

    const root = this.items[0];
    const last = this.items.pop();

    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      this.bubbleDown(0);
    }

    return root;
  }

  private bubbleUp(index: number): void {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.compare(this.items[current], this.items[parent]) >= 0) {
        return;
      }
      this.swap(current, parent);
      current = parent;
    }
  }

  private bubbleDown(index: number): void {
    let current = index;
    const lastIndex = this.items.length - 1;

    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let smallest = current;

      if (left <= lastIndex && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }
      if (right <= lastIndex && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === current) {
        return;
      }
      this.swap(current, smallest);
      current = smallest;
    }
  }

  private swap(a: number, b: number): void {
    const temp = this.items[a];
    this.items[a] = this.items[b];
    this.items[b] = temp;
  }
}

export const computePriorityScore = (
  notification: Notification,
  nowMs: number = Date.now()
): { score: number; ageMinutes: number } => {
  const ageMinutes = Math.max(0, (nowMs - notification.createdAt.getTime()) / 60000);
  const score = TYPE_WEIGHTS[notification.type] - ageMinutes * DECAY_PER_MINUTE;

  return {
    score,
    ageMinutes
  };
};

export const selectTopKNotifications = (
  notifications: Notification[],
  topK: number,
  nowMs: number = Date.now()
): ScoredNotification[] => {
  if (topK <= 0) {
    return [];
  }

  const heap = new MinHeap<ScoredNotification>((a, b) => a.score - b.score);

  for (const notification of notifications) {
    const { score, ageMinutes } = computePriorityScore(notification, nowMs);
    const scored: ScoredNotification = {
      ...notification,
      score,
      ageMinutes
    };

    if (heap.size() < topK) {
      heap.push(scored);
      continue;
    }

    const smallest = heap.peek();
    if (smallest && scored.score > smallest.score) {
      heap.pop();
      heap.push(scored);
    }
  }

  const results: ScoredNotification[] = [];
  while (heap.size() > 0) {
    const item = heap.pop();
    if (item) {
      results.push(item);
    }
  }

  return results.sort(
    (a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime()
  );
};
