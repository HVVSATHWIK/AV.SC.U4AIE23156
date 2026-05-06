const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const APP_CONFIG = {
  apiUrl: process.env.REACT_APP_API_URL ?? "/evaluation-service/notifications",
  authUrl: process.env.REACT_APP_AUTH_URL ?? "",
  apiToken: process.env.REACT_APP_API_TOKEN ?? "",
  priorityTopK: readNumber(process.env.REACT_APP_PRIORITY_TOP_K, 10),
  loggingEndpoint: process.env.REACT_APP_LOGGING_ENDPOINT ?? "",
  loggingToken: process.env.REACT_APP_LOGGING_TOKEN ?? "",
  loggingService: process.env.REACT_APP_LOGGING_SERVICE ?? "notification-frontend",
  environment: process.env.REACT_APP_ENVIRONMENT ?? "local",
  clientId: process.env.REACT_APP_CLIENT_ID ?? "",
  clientSecret: process.env.REACT_APP_CLIENT_SECRET ?? "",
  accessCode: process.env.REACT_APP_ACCESS_CODE ?? "",
  userEmail: process.env.REACT_APP_EMAIL ?? "",
  userName: process.env.REACT_APP_NAME ?? "",
  rollNo: process.env.REACT_APP_ROLL_NO ?? "",
  authTokenKey: "authToken",
  loggingTokenKey: "loggingToken",
  loggingEndpointKey: "loggingEndpoint"
};
