export type NotificationType = "Placement" | "Result" | "Event";

export type NotificationStatus = "read" | "unread";

export type NotificationStatusFilter = "all" | NotificationStatus;
export type NotificationTypeFilter = "All" | NotificationType;

export interface NotificationFilters {
  type: NotificationTypeFilter;
  status: NotificationStatusFilter;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  createdAt: Date;
  readAt: Date | null;
}

export interface NotificationApiItem {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

export interface NotificationApiResponse {
  notifications: NotificationApiItem[];
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export interface ScoredNotification extends Notification {
  score: number;
  ageMinutes: number;
}
