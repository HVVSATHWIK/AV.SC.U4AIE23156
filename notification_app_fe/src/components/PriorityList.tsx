import { Chip, Paper, Stack, Typography } from "@mui/material";
import { ScoredNotification } from "../types/notification";
import { formatRelativeTime } from "../utils/date";

interface PriorityListProps {
  items: ScoredNotification[];
  loading: boolean;
}

const PriorityList = ({ items, loading }: PriorityListProps) => {
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h5">Priority Inbox</Typography>
          <Chip label={`Top ${items.length}`} color="secondary" variant="outlined" />
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Ranking notifications by priority...
          </Typography>
        )}

        {!loading && items.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Priority inbox is empty. Check back after the next refresh.
          </Typography>
        )}

        {!loading &&
          items.map((item, index) => (
            <Stack
              key={item.id}
              spacing={0.5}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "grey.200"
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="overline" color="text.secondary">
                  #{index + 1}
                </Typography>
                <Chip label={item.type} size="small" color="primary" />
                <Chip label={item.score.toFixed(1)} size="small" variant="outlined" />
              </Stack>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {item.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelativeTime(item.createdAt)} | {item.ageMinutes.toFixed(1)}m old
              </Typography>
            </Stack>
          ))}
      </Stack>
    </Paper>
  );
};

export default PriorityList;
