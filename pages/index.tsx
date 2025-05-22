import React, { useState, useEffect } from "react";
import Head from "next/head";
import BpmnViewer from "../components/BpmnViewer";
import FileSelector from "../components/FileSelector";
import TextualProcessView from "../components/TextualProcessView";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Dynamically import HomePage to avoid issues with server-side rendering
// @ts-ignore - Suppressing module not found error
const HomePage = dynamic(() => import("./home"), {
  ssr: false,
  // Add loading component if needed
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <p>Loading...</p>
    </div>
  ),
});

// MUI Imports
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Drawer,
  Divider,
  IconButton,
  Paper,
  Toolbar,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  ThemeProvider,
  createTheme,
  TextField,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import SchemaIcon from "@mui/icons-material/Schema";
import LockIcon from "@mui/icons-material/Lock";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#13A6EA", // MediaLab brand color
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#e0e5ec", // Darker background
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0A1721", // MediaLab header color
        },
      },
    },
  },
});

// Drawer width
const drawerWidth = 300;

export default function PasswordProtectedPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check if already authenticated (using localStorage)
  useEffect(() => {
    const authenticated = localStorage.getItem("medialab_authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "medialab2024") {
      setIsAuthenticated(true);
      localStorage.setItem("medialab_authenticated", "true");
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  // If authenticated, show the actual home page
  if (isAuthenticated) {
    return <HomePage />;
  }

  // Otherwise show the password page
  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper elevation={3} sx={{ width: "100%", p: 4, borderRadius: 2 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <LockIcon sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom>
            Process Viewer Access
          </Typography>

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
            autoComplete="current-password"
            variant="outlined"
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            fullWidth
            sx={{ mt: 2 }}
          >
            Enter
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
