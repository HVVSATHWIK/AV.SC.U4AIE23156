import {
  Notification,
  NotificationApiItem,
  NotificationApiResponse,
  NotificationType
} from "../types/notification";
import { parseTimestamp } from "../utils/date";
import { apiRequest } from "./apiClient";
import { appLogger } from "./logger";

export interface NotificationQuery {
  type?: NotificationType;
  status?: "read" | "unread";
  limit?: number;
  cursor?: string;
}

const DEFAULT_API_URL =
  "http://20.207.122.201/evaluation-service/notifications";

const API_URL = process.env.REACT_APP_NOTIFICATIONS_API_URL ?? DEFAULT_API_URL;

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
  const payload = await apiRequest<NotificationApiResponse>(API_URL, { query });
  const notifications = payload.notifications.map(mapNotification);

  await logger.info("notifications mapped", { count: notifications.length });
  return notifications;
};
