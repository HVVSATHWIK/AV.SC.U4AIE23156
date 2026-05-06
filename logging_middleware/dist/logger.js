"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpTransport = exports.createLogger = void 0;
const constants_1 = require("./constants");
const isEmptyContext = (value) => {
    return !value || Object.keys(value).length === 0;
};
const mergeContext = (base, extra) => {
    if (isEmptyContext(base) && isEmptyContext(extra)) {
        return undefined;
    }
    return {
        ...(base !== null && base !== void 0 ? base : {}),
        ...(extra !== null && extra !== void 0 ? extra : {})
    };
};
const createLogger = (config) => {
    var _a, _b;
    if (!config.transport) {
        throw new Error("Log transport is required.");
    }
    const minLevel = (_a = config.minLevel) !== null && _a !== void 0 ? _a : constants_1.DEFAULT_MIN_LEVEL;
    const baseContext = (_b = config.baseContext) !== null && _b !== void 0 ? _b : {};
    const shouldLog = (level) => {
        return constants_1.LOG_LEVELS[level] >= constants_1.LOG_LEVELS[minLevel];
    };
    const send = async (level, message, metadata) => {
        if (!shouldLog(level)) {
            return;
        }
        const entry = {
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
    const withContext = (context) => {
        return (0, exports.createLogger)({
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
exports.createLogger = createLogger;
const createHttpTransport = (options) => {
    var _a;
    const headers = {
        "Content-Type": "application/json",
        ...((_a = options.headers) !== null && _a !== void 0 ? _a : {})
    };
    return async (entry) => {
        const controller = options.timeoutMs ? new AbortController() : undefined;
        const timer = options.timeoutMs
            ? setTimeout(() => controller === null || controller === void 0 ? void 0 : controller.abort(), options.timeoutMs)
            : undefined;
        try {
            const response = await fetch(options.endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify(entry),
                signal: controller === null || controller === void 0 ? void 0 : controller.signal,
                keepalive: true
            });
            if (!response.ok) {
                throw new Error(`Log transport failed with status ${response.status}.`);
            }
        }
        finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    };
};
exports.createHttpTransport = createHttpTransport;
