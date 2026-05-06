import { APP_CONFIG } from "../utils/appConfig";
import { appLogger } from "./logger";

const AUTH_REFRESH_SKEW_SECONDS = 60;

const normalizeBase64Url = (value: string): string => {
  const base = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base.length % 4;
  if (padding === 0) {
    return base;
  }

  return base.padEnd(base.length + (4 - padding), "=");
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const decoded = atob(normalizeBase64Url(parts[1]));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + AUTH_REFRESH_SKEW_SECONDS;
};

const readStoredToken = (): string | undefined =>
  localStorage.getItem(APP_CONFIG.authTokenKey) ?? undefined;

const buildAuthPayload = (): Record<string, string> => {
  const payload = {
    clientId: APP_CONFIG.clientId,
    clientSecret: APP_CONFIG.clientSecret,
    accessCode: APP_CONFIG.accessCode,
    email: APP_CONFIG.userEmail,
    name: APP_CONFIG.userName,
    rollNo: APP_CONFIG.rollNo
  };

  const missing = ["clientId", "clientSecret", "accessCode"].filter(
    (key) => !payload[key as keyof typeof payload]
  );

  if (missing.length > 0) {
    throw new Error(`Missing auth config: ${missing.join(", ")}.`);
  }

  return payload;
};

const resolveAuthUrl = (value: string): string => {
  if (value.startsWith("http")) {
    return value;
  }

  return `${window.location.origin}${value.startsWith("/") ? "" : "/"}${value}`;
};

const extractToken = (payload: unknown): string | undefined => {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const direct =
    record.token ??
    record.accessToken ??
    record.jwt ??
    record.idToken;
  if (typeof direct === "string") {
    return direct;
  }

  const nested = record.data;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    const nestedToken =
      nestedRecord.token ??
      nestedRecord.accessToken ??
      nestedRecord.jwt ??
      nestedRecord.idToken;
    if (typeof nestedToken === "string") {
      return nestedToken;
    }
  }

  return undefined;
};

export const getAuthToken = (): string | undefined => {
  const envToken = APP_CONFIG.apiToken?.trim();
  if (envToken && !isTokenExpired(envToken)) {
    return envToken;
  }

  const storedToken = readStoredToken();
  if (storedToken && !isTokenExpired(storedToken)) {
    return storedToken;
  }

  return undefined;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(APP_CONFIG.authTokenKey, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(APP_CONFIG.authTokenKey);
};

export const requestAuthToken = async (): Promise<string | undefined> => {
  if (!APP_CONFIG.authUrl) {
    return undefined;
  }

  const payload = buildAuthPayload();
  const response = await fetch(resolveAuthUrl(APP_CONFIG.authUrl), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    await appLogger.error("auth request failed", {
      status: response.status,
      response: text.slice(0, 200)
    });
    throw new Error(`Auth request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as unknown;
  const token = extractToken(data);
  if (!token) {
    throw new Error("Auth response did not include a token.");
  }

  setAuthToken(token);
  return token;
};

export const ensureAuthToken = async (): Promise<string | undefined> => {
  const existing = getAuthToken();
  if (existing) {
    return existing;
  }

  try {
    return await requestAuthToken();
  } catch (error) {
    const message = error instanceof Error ? error.message : "auth request failed";
    await appLogger.error("auth token refresh failed", { message });
    return undefined;
  }
};
