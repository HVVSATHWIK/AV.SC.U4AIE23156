import { appLogger } from "./logger";
import { clearAuthToken, ensureAuthToken, requestAuthToken } from "./auth";

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
  const start = performance.now();
  const logger = appLogger.withContext({ scope: "api" });
  const body = options.body ? JSON.stringify(options.body) : undefined;

  await logger.info("api request", { method, url });

  const buildHeaders = (token?: string) => {
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

    return headers;
  };

  const sendRequest = async (token?: string) =>
    fetch(url, {
      method,
      headers: buildHeaders(token),
      body
    });

  const token = await ensureAuthToken();
  let response = await sendRequest(token);

  if (response.status === 401) {
    clearAuthToken();
    try {
      const refreshed = await requestAuthToken();
      if (refreshed) {
        response = await sendRequest(refreshed);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "auth retry failed";
      await logger.error("auth retry failed", { message });
    }
  }

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
