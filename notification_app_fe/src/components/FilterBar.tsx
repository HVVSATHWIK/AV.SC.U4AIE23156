import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack
} from "@mui/material";
import {
  NotificationFilters,
  NotificationStatusFilter,
  NotificationTypeFilter
} from "../types/notification";

interface FilterBarProps {
  filters: NotificationFilters;
  onFiltersChange: (filters: NotificationFilters) => void;
  onRefresh: () => void;
}

const FilterBar = ({ filters, onFiltersChange, onRefresh }: FilterBarProps) => {
  const handleStatusChange = (value: NotificationStatusFilter) => {
    onFiltersChange({
      ...filters,
      status: value
    });
  };

  const handleTypeChange = (value: NotificationTypeFilter) => {
    onFiltersChange({
      ...filters,
      type: value
    });
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ alignItems: { xs: "stretch", md: "center" } }}
    >
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={filters.status}
          label="Status"
          onChange={(event) => handleStatusChange(event.target.value as NotificationStatusFilter)}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="unread">Unread</MenuItem>
          <MenuItem value="read">Read</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={filters.type}
          label="Type"
          onChange={(event) => handleTypeChange(event.target.value as NotificationTypeFilter)}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Placement">Placement</MenuItem>
          <MenuItem value="Result">Result</MenuItem>
          <MenuItem value="Event">Event</MenuItem>
        </Select>
      </FormControl>

      <Button variant="contained" color="primary" onClick={onRefresh}>
        Refresh
      </Button>
    </Stack>
  );
};

export default FilterBar;
