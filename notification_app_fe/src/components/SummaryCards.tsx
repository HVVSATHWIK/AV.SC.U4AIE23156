import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { NotificationSummary } from "../types/notification";

interface SummaryCardsProps {
  summary: NotificationSummary;
  loading: boolean;
}

const SummaryCards = ({ summary, loading }: SummaryCardsProps) => {
  const items = [
    {
      label: "Total",
      value: summary.total
    },
    {
      label: "Unread",
      value: summary.unread
    },
    {
      label: "Placements",
      value: summary.byType.Placement
    },
    {
      label: "Results",
      value: summary.byType.Result
    },
    {
      label: "Events",
      value: summary.byType.Event
    }
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        mb: 3,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(5, 1fr)"
        }
      }}
    >
      {items.map((item) => (
        <Card sx={{ height: "100%" }} key={item.label}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h4">
                {loading ? "--" : item.value}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default SummaryCards;
