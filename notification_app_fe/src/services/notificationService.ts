import {
  Notification,
  NotificationApiItem,
  NotificationApiResponse,
  NotificationType
} from "../types/notification";
import { parseTimestamp } from "../utils/date";
import { apiRequest } from "./apiClient";
import { appLogger } from "./logger";
import { APP_CONFIG } from "../utils/appConfig";

export interface NotificationQuery {
  type?: NotificationType;
  status?: "read" | "unread";
  limit?: number;
  cursor?: string;
}

const API_URL = APP_CONFIG.apiUrl;

const mapNotification = (item: NotificationApiItem): Notification => {
  const createdAt = parseTimestamp(item.Timestamp);

  return {
    id: item.ID,
    type: item.Type,
    message: item.Message,
    timestamp: item.Timestamp,
    createdAt,
    readAt: null
  };
};

export const fetchNotifications = async (
  query: NotificationQuery = {}
): Promise<Notification[]> => {
  const logger = appLogger.withContext({ scope: "notifications" });
  const queryParams: Record<string, string | number | boolean | undefined> = {
    type: query.type,
    status: query.status,
    limit: query.limit,
    cursor: query.cursor
  };
  const payload = await apiRequest<NotificationApiResponse>(API_URL, { query: queryParams });
  const notifications = payload.notifications.map(mapNotification);

  await logger.info("notifications mapped", { count: notifications.length });
  return notifications;
};
