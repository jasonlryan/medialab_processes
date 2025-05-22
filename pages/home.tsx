import React, { useState, useEffect } from "react";
import Head from "next/head";
import BpmnViewer from "../components/BpmnViewer";
import FileSelector from "../components/FileSelector";
import TextualProcessView from "../components/TextualProcessView";

// MUI Imports
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  CssBaseline,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import SchemaIcon from "@mui/icons-material/Schema";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f8fa",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
  },
});

// Drawer width
const drawerWidth = 300;

const HomePage: React.FC = () => {
  const [bpmnXml, setBpmnXml] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileList, setFileList] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"diagram" | "text">("diagram");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [processTitle, setProcessTitle] = useState<string>("");

  const fetchFileList = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/list-bpmn-files");
      if (!response.ok) {
        throw new Error(`Failed to fetch file list: ${response.statusText}`);
      }
      const data = await response.json();
      setFileList(data.files || []);
      if (data.files && data.files.length > 0 && !selectedFile) {
        // setSelectedFile(data.files[0]); // Auto-select first file if none selected
      }
    } catch (err: any) {
      console.error("Error fetching file list:", err);
      setError(`Error fetching file list: ${err.message}`);
      setFileList([]); // Ensure fileList is empty on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBpmnXml = async (filename: string) => {
    if (!filename) {
      setBpmnXml(null);
      setError(null); // Clear previous errors
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Fetching /bpmn/${filename}`);
      const response = await fetch(`/bpmn/${filename}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch BPMN XML ${response.status} ${
            response.statusText
          }. Server says: ${errorText || "No additional error message."}`
        );
      }
      const xml = await response.text();
      if (!xml) {
        console.warn(`Fetched BPMN file ${filename} is empty.`);
        throw new Error(`Fetched BPMN file ${filename} is empty.`);
      }
      setBpmnXml(xml);

      // Try to fetch the corresponding JSON file to get the process title
      fetchProcessTitle(filename);
    } catch (err: any) {
      console.error("Error fetching BPMN XML:", err);
      setError(`Error loading BPMN file '${filename}': ${err.message}`);
      setBpmnXml(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProcessTitle = async (filename: string) => {
    try {
      const jsonFileName = filename.replace(".bpmn", ".json");
      const response = await fetch(`/json/${jsonFileName}`);

      if (response.ok) {
        const jsonData = await response.json();
        if (jsonData && jsonData.name) {
          // Use the actual process name from the JSON data
          setProcessTitle(jsonData.name);
          return;
        }
      }

      // If JSON not available or doesn't have a name, use the filename
      const baseName = filename.split(".")[0];
      const nameFromFile = baseName
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      setProcessTitle(nameFromFile);
    } catch (err) {
      console.warn("Could not fetch process title from JSON:", err);
      // Fallback to filename-based title
      const baseName = filename.split(".")[0];
      const nameFromFile = baseName
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      setProcessTitle(nameFromFile);
    }
  };

  useEffect(() => {
    fetchFileList();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      fetchBpmnXml(selectedFile);
    } else {
      // If no file is selected (e.g., initial load or deselection), clear BPMN XML
      setBpmnXml(null);
    }
  }, [selectedFile]);

  const handleFileSelect = (filename: string) => {
    setSelectedFile(filename);
    // Close mobile drawer after selection on small screens
    setMobileOpen(false);
  };

  const handleFileUploaded = async () => {
    await fetchFileList(); // Refresh file list
  };

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: "diagram" | "text" | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("medialab_authenticated");
    window.location.reload();
  };

  // Drawer content - reused for both permanent and temporary variants
  const drawer = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Process Files
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <FileSelector
        fileList={fileList}
        onFileSelect={handleFileSelect}
        onFileUploaded={handleFileUploaded}
        selectedFile={selectedFile}
        fetchFileList={fetchFileList}
      />
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>BPMN Process Viewer</title>
        <meta
          name="description"
          content="View and manage BPMN process diagrams"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box sx={{ display: "flex", height: "100vh" }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            {/* MediaLab Logo */}
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              <img
                src="/images/medialab-logo.png"
                alt="MediaLab Logo"
                style={{ height: "40px", marginRight: "10px" }}
              />
            </Box>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ color: "white", flexGrow: 1 }}
            >
              Process Viewer
            </Typography>

            {/* Logout Button */}
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ ml: 2 }}
              title="Logout"
            >
              <Typography variant="body2">Logout</Typography>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              boxShadow: "2px 0px 10px rgba(0, 0, 0, 0.1)",
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              position: "relative",
              height: "100%",
              zIndex: 0,
              boxShadow: "1px 0px 8px rgba(0, 0, 0, 0.05)",
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
            },
          }}
          open
        >
          {drawer}
        </Drawer>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pt: { xs: 10, sm: 10 }, // Extra padding top to account for AppBar
            bgcolor: "#eaeff4", // Slightly darker background for the main content area
          }}
        >
          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* View Mode Toggle */}
          {selectedFile && !error && (
            <Paper
              sx={{
                mb: 2,
                p: 1,
                boxShadow: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                component="div"
                sx={{
                  ml: 2,
                  fontWeight: 500,
                  color: "text.primary",
                  flexGrow: 1,
                }}
              >
                {processTitle}
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                disabled={isLoading || !bpmnXml}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    transition: "all 0.2s ease",
                    textTransform: "none",
                    fontWeight: 500,
                    px: 2,
                    py: 1,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                      "&:not(:disabled):hover": {
                        bgcolor: "primary.dark",
                      },
                    },
                    "&:not(:disabled):hover": {
                      bgcolor: "rgba(25, 118, 210, 0.08)",
                    },
                    "&.Mui-disabled": {
                      color: "rgba(0, 0, 0, 0.26)",
                      cursor: "default",
                    },
                  },
                }}
              >
                <ToggleButton value="diagram" aria-label="diagram view">
                  <SchemaIcon sx={{ mr: 1 }} />
                  Diagram View
                </ToggleButton>
                <ToggleButton value="text" aria-label="text view">
                  <TextSnippetIcon sx={{ mr: 1 }} />
                  Textual View
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>
          )}

          {/* Content Area */}
          <Paper
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "100%",
              boxShadow: 3,
              bgcolor: "#ffffff",
              borderRadius: 1,
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {!isLoading && !error && bpmnXml && (
              <Box sx={{ flexGrow: 1, overflow: "hidden", height: "100%" }}>
                {viewMode === "diagram" ? (
                  <BpmnViewer xml={bpmnXml} />
                ) : (
                  <TextualProcessView
                    xml={bpmnXml}
                    bpmnFileName={selectedFile}
                  />
                )}
              </Box>
            )}

            {!isLoading && !selectedFile && !error && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  p: 3,
                }}
              >
                <Typography variant="body1" align="center" gutterBottom>
                  Select a BPMN file from the list to view it.
                </Typography>
                <Typography variant="body1" align="center">
                  Or upload a new BPMN file to get started.
                </Typography>
              </Box>
            )}

            {!isLoading && selectedFile && !bpmnXml && !error && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  p: 3,
                }}
              >
                <Typography variant="body1" align="center">
                  Could not load content for {selectedFile}. It might be empty
                  or an error occurred.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default HomePage;
