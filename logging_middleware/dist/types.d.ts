export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
export type LogContext = Record<string, unknown>;
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    service: string;
    environment: string;
    context?: LogContext;
    metadata?: LogContext;
}
export type LogTransport = (entry: LogEntry) => Promise<void>;
export interface LoggerConfig {
    service: string;
    environment: string;
    minLevel?: LogLevel;
    transport: LogTransport;
    baseContext?: LogContext;
}
export interface Logger {
    log: (level: LogLevel, message: string, metadata?: LogContext) => Promise<void>;
    trace: (message: string, metadata?: LogContext) => Promise<void>;
    debug: (message: string, metadata?: LogContext) => Promise<void>;
    info: (message: string, metadata?: LogContext) => Promise<void>;
    warn: (message: string, metadata?: LogContext) => Promise<void>;
    error: (message: string, metadata?: LogContext) => Promise<void>;
    fatal: (message: string, metadata?: LogContext) => Promise<void>;
    withContext: (context: LogContext) => Logger;
}
export interface HttpTransportOptions {
    endpoint: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}
//# sourceMappingURL=types.d.ts.map