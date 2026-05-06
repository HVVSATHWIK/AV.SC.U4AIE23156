import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1b6f6a",
      light: "#4a9c96",
      dark: "#0f4b47"
    },
    secondary: {
      main: "#f29f58",
      light: "#ffc07f",
      dark: "#d47c3e"
    },
    background: {
      default: "#f7f1e9",
      paper: "#ffffff"
    },
    text: {
      primary: "#0f1a1a",
      secondary: "#4a5a5a"
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: '"Space Grotesk", sans-serif',
    h1: {
      fontFamily: '"DM Serif Display", serif',
      fontSize: "3rem"
    },
    h2: {
      fontFamily: '"DM Serif Display", serif',
      fontSize: "2.5rem"
    },
    h3: {
      fontFamily: '"DM Serif Display", serif',
      fontSize: "2rem"
    },
    h4: {
      fontWeight: 600
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0 18px 40px rgba(15, 26, 26, 0.08)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 14,
          fontWeight: 600
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600
        }
      }
    }
  }
});

export default theme;
