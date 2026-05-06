import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  createHttpTransport,
  createLogger,
  LogContext,
  Logger
} from "../../../logging_middleware/src";

type NotificationType = "Placement" | "Result" | "Event";

interface NotificationApiItem {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

interface NotificationApiResponse {
  notifications: NotificationApiItem[];
}

interface ScoredNotification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  createdAt: Date;
  ageMinutes: number;
  score: number;
}

const TYPE_WEIGHTS: Record<NotificationType, number> = {
  Placement: 100,
  Result: 70,
  Event: 40
};

const DEFAULT_TOP_K = 10;
const DECAY_PER_MINUTE = 0.2;

const API_URL =
  process.env.NOTIFICATIONS_API_URL ??
  "http://20.207.122.201/evaluation-service/notifications";

const API_TOKEN = process.env.NOTIFICATIONS_API_TOKEN;
const LOGGING_ENDPOINT = process.env.LOGGING_ENDPOINT;
const LOGGING_TOKEN = process.env.LOGGING_TOKEN;

const OUTPUT_DIR =
  process.env.STAGE6_OUTPUT_DIR ??
  path.resolve(__dirname, "..", "..", "..", "stage6_output");

const TOP_K = Number(process.env.TOP_K ?? DEFAULT_TOP_K);

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

const parseTimestamp = (value: string): Date => {
  const trimmed = value.trim();
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withZone = /Z|[+-]\d{2}:?\d{2}$/.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const parsed = new Date(withZone);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp value: ${value}`);
  }

  return parsed;
};

const scoreNotification = (item: NotificationApiItem, now: number): ScoredNotification => {
  const createdAt = parseTimestamp(item.Timestamp);
  const ageMinutes = Math.max(0, (now - createdAt.getTime()) / 60000);
  const typeWeight = TYPE_WEIGHTS[item.Type];
  const score = typeWeight - ageMinutes * DECAY_PER_MINUTE;

  return {
    id: item.ID,
    type: item.Type,
    message: item.Message,
    timestamp: item.Timestamp,
    createdAt,
    ageMinutes,
    score
  };
};

const buildMarkdownTable = (items: ScoredNotification[]): string => {
  const header =
    "| Rank | Type | Score | Age (min) | Message | Timestamp | Id |\n" +
    "| --- | --- | --- | --- | --- | --- | --- |\n";

  const rows = items
    .map((item, index) => {
      return `| ${index + 1} | ${item.type} | ${item.score.toFixed(2)} | ${item.ageMinutes.toFixed(
        2
      )} | ${item.message} | ${item.timestamp} | ${item.id} |`;
    })
    .join("\n");

  return `# Stage 6 Output\n\n${header}${rows}\n`;
};

const createAppLogger = (): Logger => {
  if (!LOGGING_ENDPOINT) {
    throw new Error("LOGGING_ENDPOINT is required for mandatory logging integration.");
  }

  const headers: Record<string, string> = {};
  if (LOGGING_TOKEN) {
    headers.Authorization = `Bearer ${LOGGING_TOKEN}`;
  }

  return createLogger({
    service: process.env.LOGGING_SERVICE ?? "notification-stage6",
    environment: process.env.NODE_ENV ?? "local",
    transport: createHttpTransport({
      endpoint: LOGGING_ENDPOINT,
      headers,
      timeoutMs: 5000
    })
  });
};

const fetchNotifications = async (logger: Logger): Promise<NotificationApiItem[]> => {
  if (!API_TOKEN) {
    throw new Error("NOTIFICATIONS_API_TOKEN is required to access the protected API.");
  }

  await logger.info("fetching notifications", { url: API_URL });
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`Notification API failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as NotificationApiResponse;
  if (!payload.notifications || !Array.isArray(payload.notifications)) {
    throw new Error("Notification API response is missing notifications array.");
  }

  await logger.info("notifications fetched", { count: payload.notifications.length });
  return payload.notifications;
};

const selectTopK = (items: NotificationApiItem[], logger: Logger): ScoredNotification[] => {
  const now = Date.now();
  const heap = new MinHeap<ScoredNotification>((a, b) => a.score - b.score);

  for (const item of items) {
    const scored = scoreNotification(item, now);

    if (heap.size() < TOP_K) {
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

  results.sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime());

  const summary: LogContext = {
    topK: results.length,
    weights: TYPE_WEIGHTS,
    decayPerMinute: DECAY_PER_MINUTE
  };
  void logger.info("priority inbox selected", summary);

  return results;
};

const writeOutputs = async (items: ScoredNotification[], logger: Logger): Promise<void> => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const jsonPath = path.join(OUTPUT_DIR, "stage6_output.json");
  const mdPath = path.join(OUTPUT_DIR, "stage6_output.md");

  const output = {
    generatedAt: new Date().toISOString(),
    topK: items.length,
    weights: TYPE_WEIGHTS,
    decayPerMinute: DECAY_PER_MINUTE,
    notifications: items.map((item) => ({
      id: item.id,
      type: item.type,
      message: item.message,
      timestamp: item.timestamp,
      ageMinutes: Number(item.ageMinutes.toFixed(2)),
      score: Number(item.score.toFixed(2))
    }))
  };

  await writeFile(jsonPath, JSON.stringify(output, null, 2), "utf-8");
  await writeFile(mdPath, buildMarkdownTable(items), "utf-8");

  await logger.info("stage6 output written", { jsonPath, mdPath });
};

const toErrorContext = (error: unknown): LogContext => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: String(error)
  };
};

const main = async (): Promise<void> => {
  const logger = createAppLogger();
  const items = await fetchNotifications(logger);
  const topItems = selectTopK(items, logger);
  await writeOutputs(topItems, logger);
};

main().catch(async (error) => {
  try {
    const logger = createAppLogger();
    await logger.error("stage6 failed", toErrorContext(error));
  } catch {
    // Avoid console logging; rely on failing fast if logging is misconfigured.
  }
  process.exitCode = 1;
});
