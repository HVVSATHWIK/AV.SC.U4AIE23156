import { createHttpTransport, createLogger, Logger } from "logging_middleware";

const endpoint = process.env.REACT_APP_LOGGING_ENDPOINT;
const token = process.env.REACT_APP_LOGGING_TOKEN;

const transport = endpoint
  ? createHttpTransport({
      endpoint,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      timeoutMs: 5000
    })
  : async () => Promise.resolve();

export const appLogger: Logger = createLogger({
  service: process.env.REACT_APP_LOGGING_SERVICE ?? "notification-frontend",
  environment: process.env.NODE_ENV ?? "local",
  transport
});
