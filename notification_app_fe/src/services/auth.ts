import { APP_CONFIG } from "../utils/appConfig";
import { appLogger } from "./logger";

interface AuthResponse {
  token_type?: string;
  access_token?: string;
  expires_in?: number;
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");

  try {
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isTokenValid = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;

  if (!exp) {
    return true;
  }

  const now = Date.now() / 1000;
  return exp - 30 > now;
};

const fetchAuthToken = async (): Promise<string | undefined> => {
  const hasAuthConfig =
    APP_CONFIG.authUrl &&
    APP_CONFIG.clientId &&
    APP_CONFIG.clientSecret &&
    APP_CONFIG.accessCode &&
    APP_CONFIG.userEmail &&
    APP_CONFIG.userName &&
    APP_CONFIG.rollNo;

  if (!hasAuthConfig) {
    return undefined;
  }

  try {
    const response = await fetch(APP_CONFIG.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: APP_CONFIG.userEmail,
        name: APP_CONFIG.userName,
        rollNo: APP_CONFIG.rollNo,
        accessCode: APP_CONFIG.accessCode,
        clientID: APP_CONFIG.clientId,
        clientSecret: APP_CONFIG.clientSecret
      })
    });

    if (!response.ok) {
      await appLogger.error("auth token request failed", {
        status: response.status
      });
      return undefined;
    }

    const payload = (await response.json()) as AuthResponse;
    const token = payload.access_token?.trim();
    if (!token) {
      return undefined;
    }

    localStorage.setItem(APP_CONFIG.authTokenKey, token);
    await appLogger.info("auth token stored", { source: "auth" });
    return token;
  } catch (error) {
    const message = error instanceof Error ? error.message : "auth error";
    await appLogger.error("auth token request failed", { message });
    return undefined;
  }
};

export const resolveAuthToken = async (): Promise<string | undefined> => {
  const stored = localStorage.getItem(APP_CONFIG.authTokenKey);
  if (stored && isTokenValid(stored)) {
    return stored;
  }

  const envToken = APP_CONFIG.apiToken?.trim();
  if (envToken && isTokenValid(envToken)) {
    return envToken;
  }

  return fetchAuthToken();
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(APP_CONFIG.authTokenKey, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(APP_CONFIG.authTokenKey);
};
