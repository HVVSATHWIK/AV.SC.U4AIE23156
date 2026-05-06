import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Notification,
  NotificationFilters,
  NotificationSummary
} from "../types/notification";
import { fetchNotifications } from "../services/notificationService";
import { appLogger } from "../services/logger";

const DEFAULT_PAGE_SIZE = 10;

const buildSummary = (notifications: Notification[]): NotificationSummary => {
  const byType = {
    Placement: 0,
    Result: 0,
    Event: 0
  };

  for (const notification of notifications) {
    byType[notification.type] += 1;
  }

  return {
    total: notifications.length,
    unread: notifications.filter((item) => !item.readAt).length,
    byType
  };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({
    type: "All",
    status: "all"
  });
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNotifications();
      setNotifications(data);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load data.";
      setError(message);
      await appLogger.error("notification fetch failed", { message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateFilters = useCallback((nextFilters: NotificationFilters) => {
    setFilters(nextFilters);
    setPage(1);
    void appLogger.info("filters updated", { filters: nextFilters });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id && !item.readAt
          ? {
              ...item,
              readAt: new Date()
            }
          : item
      )
    );
    void appLogger.info("notification marked read", { id });
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesType =
        filters.type === "All" || notification.type === filters.type;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "read" ? !!notification.readAt : !notification.readAt);

      return matchesType && matchesStatus;
    });
  }, [notifications, filters]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredNotifications.length / DEFAULT_PAGE_SIZE)
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(1);
    }
  }, [page, pageCount]);

  const pagedNotifications = useMemo(() => {
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    return filteredNotifications.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [filteredNotifications, page]);

  const summary = useMemo(
    () => buildSummary(notifications),
    [notifications]
  );

  return {
    notifications,
    filteredNotifications,
    pagedNotifications,
    summary,
    loading,
    error,
    filters,
    page,
    pageCount,
    lastUpdated,
    refresh,
    updateFilters,
    setPage,
    markAsRead
  };
};
