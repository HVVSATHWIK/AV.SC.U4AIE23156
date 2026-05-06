import { appLogger } from "./logger";
import { resolveAuthToken } from "./auth";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export const buildUrl = (
  baseUrl: string,
  path?: string,
  query?: Record<string, string | number | boolean | undefined>
): string => {
  const resolvedBase = baseUrl.startsWith("http")
    ? baseUrl
    : `${window.location.origin}${baseUrl.startsWith("/") ? "" : "/"}${baseUrl}`;
  const url = new URL(path ?? "", resolvedBase);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

export const apiRequest = async <T>(
  baseUrl: string,
  options: ApiRequestOptions = {},
  path?: string
): Promise<T> => {
  const url = buildUrl(baseUrl, path, options.query);
  const method = options.method ?? "GET";
  const token = await resolveAuthToken();
  const start = performance.now();
  const logger = appLogger.withContext({ scope: "api" });

  await logger.info("api request", { method, url });

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {})
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const durationMs = Math.round(performance.now() - start);

  if (!response.ok) {
    const responseText = await response.text();
    await logger.error("api error", {
      url,
      method,
      status: response.status,
      durationMs,
      response: responseText.slice(0, 300)
    });
    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    await logger.info("api success", { url, method, durationMs });
    return undefined as T;
  }

  const payload = (await response.json()) as T;
  await logger.info("api success", { url, method, durationMs });

  return payload;
};
