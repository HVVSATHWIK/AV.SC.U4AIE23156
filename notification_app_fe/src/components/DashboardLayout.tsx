import { Box, Container, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <Box sx={{ minHeight: "100vh", pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 4, md: 6 }, pb: 6 }}>
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
            Campus Alerts
          </Typography>
          <Typography variant="h3">Notification Command Center</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
            Track placements, results, and events with real-time delivery, priority ranking,
            and an operational view of unread activity.
          </Typography>
        </Stack>
        {children}
      </Container>
    </Box>
  );
};

export default DashboardLayout;
