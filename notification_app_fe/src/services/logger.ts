import { createHttpTransport, createLogger, Logger } from "logging_middleware";
import { APP_CONFIG } from "../utils/appConfig";

const buildTransport = () => {
  if (!APP_CONFIG.loggingEndpoint) {
    return async () => Promise.resolve();
  }

  const token = localStorage.getItem(APP_CONFIG.loggingTokenKey);
  const transport = createHttpTransport({
    endpoint: APP_CONFIG.loggingEndpoint,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    timeoutMs: 5000
  });

  return async (entry: Parameters<typeof transport>[0]) => {
    try {
      await transport(entry);
    } catch {
      // Avoid console logging; keep logging failures non-blocking.
    }
  };
};

export const appLogger: Logger = createLogger({
  service: APP_CONFIG.loggingService,
  environment: APP_CONFIG.environment,
  transport: buildTransport()
});
