export const getAuthToken = (): string | undefined => {
  return localStorage.getItem("authToken") ?? process.env.REACT_APP_API_TOKEN ?? undefined;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem("authToken");
};
