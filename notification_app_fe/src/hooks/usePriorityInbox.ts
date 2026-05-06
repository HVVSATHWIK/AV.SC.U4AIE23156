import { useMemo } from "react";
import { Notification } from "../types/notification";
import { selectTopKNotifications } from "../utils/priority";

export const usePriorityInbox = (
  notifications: Notification[],
  topK: number
) => {
  return useMemo(
    () => selectTopKNotifications(notifications, topK),
    [notifications, topK]
  );
};
