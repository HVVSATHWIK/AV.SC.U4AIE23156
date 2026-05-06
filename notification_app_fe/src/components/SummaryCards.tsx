import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
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
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item.label}>
          <Card sx={{ height: "100%" }}>
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
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
