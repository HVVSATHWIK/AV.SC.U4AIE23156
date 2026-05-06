import {
  Alert,
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import DashboardLayout from "../components/DashboardLayout";
import SummaryCards from "../components/SummaryCards";
import FilterBar from "../components/FilterBar";
import NotificationList from "../components/NotificationList";
import PaginationControls from "../components/PaginationControls";
import PriorityList from "../components/PriorityList";
import { useNotifications } from "../hooks/useNotifications";
import { usePriorityInbox } from "../hooks/usePriorityInbox";
import { formatTimestamp } from "../utils/date";

const DEFAULT_TOP_K = 10;

const DashboardPage = () => {
  const {
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
  } = useNotifications();

  const topK = Number(process.env.REACT_APP_PRIORITY_TOP_K ?? DEFAULT_TOP_K);
  const priorityItems = usePriorityInbox(notifications, topK);

  return (
    <DashboardLayout>
      <SummaryCards summary={summary} loading={loading} />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="h5">All notifications</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredNotifications.length} entries
                  </Typography>
                </Box>
                {lastUpdated && (
                  <Typography variant="caption" color="text.secondary">
                    Last synced {formatTimestamp(lastUpdated)}
                  </Typography>
                )}
              </Stack>

              <FilterBar filters={filters} onFiltersChange={updateFilters} onRefresh={refresh} />

              {loading && <LinearProgress />}

              {error && <Alert severity="error">{error}</Alert>}

              <NotificationList notifications={pagedNotifications} onMarkRead={markAsRead} />

              <PaginationControls page={page} count={pageCount} onChange={setPage} />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <PriorityList items={priorityItems} loading={loading} />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default DashboardPage;
