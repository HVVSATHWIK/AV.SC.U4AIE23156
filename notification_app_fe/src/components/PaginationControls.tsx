import { Pagination, Stack } from "@mui/material";

interface PaginationControlsProps {
  page: number;
  count: number;
  onChange: (page: number) => void;
}

const PaginationControls = ({ page, count, onChange }: PaginationControlsProps) => {
  if (count <= 1) {
    return null;
  }

  return (
    <Stack alignItems="center" sx={{ pt: 2 }}>
      <Pagination
        page={page}
        count={count}
        color="primary"
        onChange={(_, value) => onChange(value)}
      />
    </Stack>
  );
};

export default PaginationControls;
