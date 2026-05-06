import { Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Notification } from "../types/notification";
import { computePriorityScore } from "../utils/priority";
import { formatRelativeTime, formatTimestamp } from "../utils/date";

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

const NotificationCard = ({ notification, onMarkRead }: NotificationCardProps) => {
  const { score, ageMinutes } = computePriorityScore(notification);
  const isUnread = !notification.readAt;

  const typeColor = {
    Placement: "success",
    Result: "info",
    Event: "warning"
  } as const;

  return (
    <Card
      sx={{
        borderLeft: "4px solid",
        borderColor: isUnread ? "primary.main" : "grey.300",
        opacity: isUnread ? 1 : 0.7
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Chip label={notification.type} color={typeColor[notification.type]} size="small" />
            <Chip
              label={`Priority ${score.toFixed(1)}`}
              color="secondary"
              size="small"
              variant="outlined"
            />
            <Chip
              label={isUnread ? "Unread" : "Read"}
              size="small"
              variant={isUnread ? "filled" : "outlined"}
            />
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {notification.message}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {formatTimestamp(notification.createdAt)} | {formatRelativeTime(notification.createdAt)}
            {ageMinutes > 0 ? ` | ${ageMinutes.toFixed(1)}m old` : ""}
          </Typography>

          {isUnread && (
            <Button size="small" variant="outlined" onClick={() => onMarkRead(notification.id)}>
              Mark as read
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
