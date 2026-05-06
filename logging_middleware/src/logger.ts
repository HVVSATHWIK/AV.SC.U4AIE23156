import { DEFAULT_MIN_LEVEL, LOG_LEVELS } from "./constants";
import {
  HttpTransportOptions,
  LogContext,
  LogEntry,
  Logger,
  LoggerConfig,
  LogLevel,
  LogTransport
} from "./types";

const isEmptyContext = (value?: LogContext): boolean => {
  return !value || Object.keys(value).length === 0;
};

const mergeContext = (base?: LogContext, extra?: LogContext): LogContext | undefined => {
  if (isEmptyContext(base) && isEmptyContext(extra)) {
    return undefined;
  }

  return {
    ...(base ?? {}),
    ...(extra ?? {})
  };
};

export const createLogger = (config: LoggerConfig): Logger => {
  if (!config.transport) {
    throw new Error("Log transport is required.");
  }

  const minLevel = config.minLevel ?? DEFAULT_MIN_LEVEL;
  const baseContext = config.baseContext ?? {};

  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
  };

  const send = async (
    level: LogLevel,
    message: string,
    metadata?: LogContext
  ): Promise<void> => {
    if (!shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: config.service,
      environment: config.environment,
      context: isEmptyContext(baseContext) ? undefined : baseContext,
      metadata: isEmptyContext(metadata) ? undefined : metadata
    };

    await config.transport(entry);
  };

  const withContext = (context: LogContext): Logger => {
    return createLogger({
      ...config,
      baseContext: mergeContext(baseContext, context)
    });
  };

  return {
    log: send,
    trace: (message, metadata) => send("trace", message, metadata),
    debug: (message, metadata) => send("debug", message, metadata),
    info: (message, metadata) => send("info", message, metadata),
    warn: (message, metadata) => send("warn", message, metadata),
    error: (message, metadata) => send("error", message, metadata),
    fatal: (message, metadata) => send("fatal", message, metadata),
    withContext
  };
};

export const createHttpTransport = (options: HttpTransportOptions): LogTransport => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {})
  };

  return async (entry: LogEntry): Promise<void> => {
    const controller = options.timeoutMs ? new AbortController() : undefined;
    const timer = options.timeoutMs
      ? setTimeout(() => controller?.abort(), options.timeoutMs)
      : undefined;

    try {
      const response = await fetch(options.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(entry),
        signal: controller?.signal,
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`Log transport failed with status ${response.status}.`);
      }
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  };
};
