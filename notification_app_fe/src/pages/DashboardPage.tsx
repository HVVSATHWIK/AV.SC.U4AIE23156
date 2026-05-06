import { Alert, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import DashboardLayout from "../components/DashboardLayout";
import SummaryCards from "../components/SummaryCards";
import FilterBar from "../components/FilterBar";
import NotificationList from "../components/NotificationList";
import PaginationControls from "../components/PaginationControls";
import PriorityList from "../components/PriorityList";
import { useNotifications } from "../hooks/useNotifications";
import { usePriorityInbox } from "../hooks/usePriorityInbox";
import { formatTimestamp } from "../utils/date";
import { APP_CONFIG } from "../utils/appConfig";

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

  const priorityItems = usePriorityInbox(notifications, APP_CONFIG.priorityTopK);

  return (
    <DashboardLayout>
      <SummaryCards summary={summary} loading={loading} />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "2.1fr 1fr" }
        }}
      >
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", md: "center" }
                }}
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

        <PriorityList items={priorityItems} loading={loading} />
      </Box>
    </DashboardLayout>
  );
};

export default DashboardPage;
