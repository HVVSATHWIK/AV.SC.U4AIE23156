import { Paper, Stack, Typography } from "@mui/material";
import { Notification } from "../types/notification";
import NotificationCard from "./NotificationCard";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}

const NotificationList = ({ notifications, onMarkRead }: NotificationListProps) => {
  if (notifications.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No notifications match the current filters.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
        />
      ))}
    </Stack>
  );
};

export default NotificationList;
