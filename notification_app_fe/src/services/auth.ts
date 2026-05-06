import { APP_CONFIG } from "../utils/appConfig";

export const getAuthToken = (): string | undefined => {
  return localStorage.getItem(APP_CONFIG.authTokenKey) ?? APP_CONFIG.apiToken ?? undefined;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(APP_CONFIG.authTokenKey, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(APP_CONFIG.authTokenKey);
};
