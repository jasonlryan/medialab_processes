import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "../styles/BpmnViewer.module.css";
import type BpmnJS from "bpmn-js/dist/bpmn-navigated-viewer.production.min.js";
import jsPDF from "jspdf";

// MUI imports
import {
  Box,
  IconButton,
  ButtonGroup,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoIcon from "@mui/icons-material/Info";
import SchemaIcon from "@mui/icons-material/Schema";

// Type for svg2pdf function - can be refined if more specific types are known
type Svg2PdfFunc = (
  element: SVGElement,
  pdf: jsPDF,
  options?: object
) => Promise<void>;

// Import CSS only on client side
const ClientSideStyles = () => {
  useEffect(() => {
    // Import CSS files on the client side
    import("bpmn-js/dist/assets/diagram-js.css");
    import("bpmn-js/dist/assets/bpmn-font/css/bpmn.css");

    // Import our custom BPMN styles
    const link = document.createElement("link");
    link.href = "/styles/bpmn-styles.css";
    link.type = "text/css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // We now import global BPMN styles in _app.tsx
  }, []);

  return null;
};

interface BpmnViewerProps {
  xml: string;
}

const BpmnViewer: React.FC<BpmnViewerProps> = ({ xml }) => {
  const viewerContainerRef = useRef<HTMLDivElement>(null); // For full-screen
  const canvasRef = useRef<HTMLDivElement>(null); // For bpmn-js
  const [viewer, setViewer] = useState<BpmnJS | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [svg2pdfFunc, setSvg2pdfFunc] = useState<Svg2PdfFunc | null>(null);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertSeverity, setAlertSeverity] = useState<
    "error" | "success" | "info" | "warning"
  >("error");

  // Load CSS on client side only
  useEffect(() => {
    import("bpmn-js/dist/assets/diagram-js.css").catch((err) =>
      console.error("Failed to load diagram-js.css", err)
    );
    import("bpmn-js/dist/assets/bpmn-font/css/bpmn.css").catch((err) =>
      console.error("Failed to load bpmn.css", err)
    );

    import("svg2pdf.js")
      .then((module) => {
        console.log("svg2pdf.js module loaded:", module);
        let funcToSet: Svg2PdfFunc | null = null;

        if (module && typeof module.default === "function") {
          funcToSet = module.default as unknown as Svg2PdfFunc;
          console.log("Using module.default for svg2pdf");
        } else if (module && typeof (module as any).svg2pdf === "function") {
          // Check for module.svg2pdf for cases where it's not the default export
          funcToSet = (module as any).svg2pdf as Svg2PdfFunc;
          console.log("Using module.svg2pdf for svg2pdf");
        } else if (typeof module === "function") {
          // Check if the module itself is the function
          funcToSet = module as unknown as Svg2PdfFunc;
          console.log("Using module (itself is a function) for svg2pdf");
        }

        if (funcToSet) {
          setSvg2pdfFunc(() => funcToSet);
        } else {
          // Fallback: Check window global more directly if module checks fail
          if (
            typeof window !== "undefined" &&
            typeof window.svg2pdf === "function"
          ) {
            setSvg2pdfFunc(() => window.svg2pdf as Svg2PdfFunc);
            console.log(
              "Using window.svg2pdf as a fallback after module checks failed."
            );
          } else {
            console.error(
              "svg2pdf function could not be resolved from module (default, .svg2pdf, or module itself) or as a window global.",
              "Module content:",
              module // Log the module content for deeper inspection
            );
            showAlert(
              "PDF generation library failed to load correctly (function not found).",
              "error"
            );
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load svg2pdf.js dynamic import", err);
        showAlert("PDF generation library could not be loaded.", "error");
      });
  }, []);

  // Helper to show alerts
  const showAlert = (
    message: string,
    severity: "error" | "success" | "info" | "warning"
  ) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);

    // For errors, also update the error state
    if (severity === "error") {
      setError(message);
    }
  };

  // Handle alert close
  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  // Initialize the viewer
  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;
    let bpmnViewerInstance: BpmnJS | null = null;

    const initViewer = async () => {
      try {
        const BpmnJSModule = await import(
          "bpmn-js/dist/bpmn-navigated-viewer.production.min.js"
        );

        if (!isMounted || !canvasRef.current) return;

        const BpmnJSConstructor = BpmnJSModule.default;

        // Initialize with disabled hover behavior
        bpmnViewerInstance = new BpmnJSConstructor({
          container: canvasRef.current,
          // Disable interactive features that may cause hover effects
          keyboard: { bindTo: document },
          additionalModules: [],
        });

        // Disable hover behavior right after initialization
        if (bpmnViewerInstance) {
          try {
            // Get event bus module
            const eventBus = bpmnViewerInstance.get("eventBus");
            if (eventBus) {
              // Prevent hover events from propagating
              ["element.hover", "element.out", "hover"].forEach((event) => {
                eventBus.on(event, function (e: any) {
                  e.stopPropagation();
                  return false;
                });
              });
            }
          } catch (err) {
            console.warn("Could not disable hover events:", err);
          }
        }

        setViewer(bpmnViewerInstance);
      } catch (err: unknown) {
        console.error("Failed to initialize BPMN viewer:", err);
        if (isMounted) {
          let message = "Could not initialize BPMN viewer.";
          if (err instanceof Error) {
            message += ` ${err.message}`;
          }
          showAlert(message, "error");
        }
      }
    };

    initViewer();

    return () => {
      isMounted = false;
      if (bpmnViewerInstance) {
        bpmnViewerInstance.destroy();
      }
    };
  }, []);

  const loadDiagramInternal = useCallback(
    async (xmlSource: string, isPath: boolean) => {
      if (!viewer) return;
      console.log(
        `[BpmnViewer] Attempting to load diagram from ${
          isPath ? "path" : "XML string"
        }:`,
        isPath ? xmlSource : xmlSource.substring(0, 100)
      );
      try {
        setLoading(true);
        setError(null);
        let diagramXML = xmlSource;
        if (isPath) {
          const response = await fetch(xmlSource);
          console.log(
            "[BpmnViewer] Fetch response status:",
            response.status,
            response.statusText
          );
          if (!response.ok) {
            const errorText = await response.text();
            console.error("[BpmnViewer] Fetch error response text:", errorText);
            throw new Error(
              `Failed to load diagram: ${response.statusText} (status: ${
                response.status
              }) - ${errorText.substring(0, 100)}`
            );
          }
          diagramXML = await response.text();
        }
        console.log(
          "[BpmnViewer] Fetched diagramXML (first 300 chars):",
          diagramXML.substring(0, 300)
        );
        await viewer.importXML(diagramXML);
        const canvas = viewer.get("canvas");
        canvas.zoom("fit-viewport");

        // Get the zoom level properly
        const currentZoomLevel = canvas.zoom(1.0);
        if (typeof currentZoomLevel === "number") {
          setCurrentZoom(currentZoomLevel);
        }

        // Apply our custom arrow markers
        applyBpmnArrows();

        setLoading(false);
      } catch (err: unknown) {
        console.error("[BpmnViewer] Error loading diagram:", err);
        setLoading(false);
        let errorMessage = "Failed to load diagram";
        if (err instanceof Error) {
          errorMessage += `: ${err.message}`;
        }
        setError(errorMessage);
        showAlert(errorMessage, "error");
      }
    },
    [viewer]
  );

  // Function to apply arrow markers to sequence flows
  const applyBpmnArrows = useCallback(() => {
    if (!viewer) return;

    try {
      // Get the SVG element
      const svg = document.querySelector(".bjs-container svg");
      if (!svg) {
        console.warn("[BpmnViewer] SVG element not found");
        return;
      }

      // Check if marker definitions exist
      let defs = svg.querySelector("defs");
      if (!defs) {
        // Create defs element if it doesn't exist
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.prepend(defs);
      }

      // Check if the sequence flow marker exists
      let marker = defs.querySelector("#sequenceflow-end-marker");
      if (!marker) {
        // Create sequence flow end marker (arrow)
        marker = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "marker"
        );
        marker.setAttribute("id", "sequenceflow-end-marker");
        marker.setAttribute("viewBox", "0 0 20 20");
        marker.setAttribute("refX", "11");
        marker.setAttribute("refY", "10");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "10");
        marker.setAttribute("orient", "auto");

        // Create arrow path
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute("d", "M 1 5 L 11 10 L 1 15 Z");
        path.setAttribute("fill", "#404040"); // Dark gray sequence flow color

        marker.appendChild(path);
        defs.appendChild(marker);
      }

      // Apply marker to all sequence flows that don't already have it
      const connections = svg.querySelectorAll(
        ".djs-connection .djs-visual path"
      );
      connections.forEach((connection) => {
        if (
          !connection.getAttribute("marker-end") ||
          connection.getAttribute("marker-end") === "none"
        ) {
          connection.setAttribute(
            "marker-end",
            "url(#sequenceflow-end-marker)"
          );
        }
      });

      // Remove bold styling from all text elements
      const textElements = svg.querySelectorAll("text, tspan");
      textElements.forEach((textElement) => {
        if (textElement instanceof SVGElement) {
          textElement.style.fontWeight = "normal";
          textElement.setAttribute("font-weight", "normal");
        }
      });

      console.log(
        "[BpmnViewer] Applied arrow markers and normalized text styling"
      );
    } catch (err) {
      console.error("[BpmnViewer] Error applying styling:", err);
    }
  }, [viewer]);

  useEffect(() => {
    if (xml && viewer) loadDiagramInternal(xml, false);
  }, [xml, viewer, loadDiagramInternal]);

  // Disable hover behaviors after diagram is loaded
  useEffect(() => {
    if (!viewer) return;

    const disableHoverBehaviors = () => {
      try {
        // Try to get the event bus to unregister hover behaviors
        const eventBus = viewer.get("eventBus");
        if (eventBus) {
          // Unbind hover events
          const events = [
            "element.hover",
            "element.out",
            "hover",
            "shape.hover",
            "connection.hover",
          ];

          events.forEach((event) => {
            // Remove all listeners for these events
            eventBus.off(event);
          });

          console.log("Successfully disabled BPMN hover behaviors");
        }

        // Try to disable any hover overlays
        const overlays = viewer.get("overlays");
        if (overlays) {
          const overlayContainer = document.querySelector(
            ".djs-overlays-container"
          );
          if (overlayContainer && overlayContainer instanceof HTMLElement) {
            overlayContainer.style.pointerEvents = "none";
          }
        }
      } catch (err) {
        console.error("Error disabling hover behaviors:", err);
      }
    };

    // Run this after a slight delay to ensure the diagram is fully loaded
    setTimeout(disableHoverBehaviors, 500);

    // Also run it after the diagram changes or imports
    viewer.on("import.done", disableHoverBehaviors);

    return () => {
      if (viewer) {
        viewer.off("import.done", disableHoverBehaviors);
      }
    };
  }, [viewer]);

  // Continuously remove hover states effect as a last resort
  useEffect(() => {
    if (!viewer) return;

    let timeoutId: NodeJS.Timeout;

    const removeHoverStyles = () => {
      try {
        // Find all elements with hover classes and remove them
        const hoverElements = document.querySelectorAll(
          ".hover, .djs-hover, .djs-element.hover"
        );
        hoverElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.classList.remove("hover", "djs-hover");
            // Force reset any inline hover styles
            el.style.stroke = "";
            el.style.strokeWidth = "";
            el.style.fillOpacity = "";
            el.style.fill = "";
          }
        });

        // Schedule next check
        timeoutId = setTimeout(removeHoverStyles, 100);
      } catch (err) {
        console.error("Error in hover style removal:", err);
      }
    };

    // Start the continuous checking
    removeHoverStyles();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [viewer]);

  const handleZoom = (factor: number) => {
    if (!viewer) return;
    const canvas = viewer.get("canvas");
    const newZoom = currentZoom * factor;
    canvas.zoom(newZoom);
    setCurrentZoom(newZoom);
  };

  const handlePan = (dx: number, dy: number) => {
    if (!viewer) return;
    const canvas = viewer.get("canvas");
    canvas.scroll({ dx, dy });
  };

  const handleDownloadPdf = async () => {
    if (!viewer) {
      setError("Viewer not ready.");
      return;
    }
    if (!svg2pdfFunc) {
      setError("PDF generation library not loaded or failed to load.");
      console.error("svg2pdfFunc is not available", svg2pdfFunc);
      return;
    }
    try {
      setLoading(true);
      const { svg } = await viewer.saveSVG();
      const pdf = new jsPDF("l", "pt", "a4"); // Landscape, points, A4
      // Convert SVG to PDF using svg2pdf.js
      // The SVG needs to have width and height attributes for svg2pdf to work reliably.
      // bpmn-js SVGs might not have these, or they might be 100%.
      // We might need to get dimensions from the viewBox or the canvas itself.

      const tempSvgElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      tempSvgElement.innerHTML = svg;
      const svgNode = tempSvgElement.firstChild as SVGGraphicsElement;

      let svgWidth = 1000; // default
      let svgHeight = 700; // default

      if (svgNode && typeof svgNode.getBBox === "function") {
        const bbox = svgNode.getBBox();
        if (bbox.width && bbox.height) {
          svgWidth = bbox.width;
          svgHeight = bbox.height;
        }
      }

      tempSvgElement.setAttribute("width", `${svgWidth}px`);
      tempSvgElement.setAttribute("height", `${svgHeight}px`);

      await svg2pdfFunc(tempSvgElement, pdf, {
        x: 0,
        y: 0,
        width: pdf.internal.pageSize.getWidth(),
        height: pdf.internal.pageSize.getHeight(),
        scale: Math.min(
          pdf.internal.pageSize.getWidth() / svgWidth,
          pdf.internal.pageSize.getHeight() / svgHeight
        ), // Scale to fit page
      });
      pdf.save(`${fileName || "diagram"}.pdf`);
    } catch (err: unknown) {
      let message = "Failed to download PDF.";
      if (err instanceof Error) message += ` ${err.message}`;
      console.error(message, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullScreen = async () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await viewerContainerRef.current.requestFullscreen();
        // setIsFullScreen(true); // State will be updated by event listener
      } catch (err: unknown) {
        let message = "Error attempting full-screen.";
        if (err instanceof Error) message += ` ${err.message} (${err.name})`;
        setError(message);
        console.error(message, err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          // setIsFullScreen(false); // State will be updated by event listener
        }
      } catch (err: unknown) {
        let message = "Error exiting full-screen.";
        if (err instanceof Error) message += ` ${err.message} (${err.name})`;
        setError(message);
        console.error(message, err);
      }
    }
  };

  // Listener for fullscreen change (e.g. user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange); // Safari
    document.addEventListener("mozfullscreenchange", handleFullscreenChange); // Firefox
    document.addEventListener("MSFullscreenChange", handleFullscreenChange); // IE/Edge
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  // Continuously force normal font weight on all text elements
  useEffect(() => {
    if (!viewer) return;

    // Continuously force normal font weight on all text elements
    const forcedInterval = setInterval(() => {
      try {
        // Get all SVG text elements
        const svgElement = document.querySelector(".bjs-container svg");
        if (!svgElement) return;

        // Force normal weight on all text and tspan elements
        const textElements = svgElement.querySelectorAll("text, tspan");
        textElements.forEach((el) => {
          if (el instanceof SVGElement) {
            // Apply via style
            el.style.fontWeight = "normal";

            // Apply via attribute
            el.setAttribute("font-weight", "normal");

            // Remove any bold styling classes
            el.classList.remove("bold", "font-bold", "font-weight-bold");

            // Force overwrite any inline styles
            const currentStyle = el.getAttribute("style") || "";
            if (!currentStyle.includes("font-weight: normal")) {
              el.setAttribute(
                "style",
                `${currentStyle}; font-weight: normal !important;`
              );
            }
          }
        });

        // Also check for "Offer Accepted" specifically by content
        const offerAcceptedElements = Array.from(textElements).filter(
          (el) => el.textContent && el.textContent.includes("Offer Accepted")
        );

        offerAcceptedElements.forEach((el) => {
          if (el instanceof SVGElement) {
            el.style.fontWeight = "normal";
            el.setAttribute("font-weight", "normal");
          }
        });
      } catch (err) {
        console.error("Error in forced text styling:", err);
      }
    }, 500); // Run every 500ms

    return () => {
      clearInterval(forcedInterval);
    };
  }, [viewer]);

  // Replace the render part with MUI components
  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      ref={viewerContainerRef}
      className={isFullScreen ? styles.fullScreen : ""}
    >
      <ClientSideStyles />

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          p: 1,
          bgcolor: "background.paper",
          borderBottom: "1px solid rgba(0,0,0,0.12)",
        }}
      >
        <ButtonGroup
          size="small"
          variant="outlined"
          sx={{
            "& .MuiButtonGroup-grouped": {
              transition: "all 0.2s ease",
              "&:not(:disabled):hover": {
                bgcolor: "rgba(25, 118, 210, 0.08)",
                borderColor: "#1976d2",
              },
              "&:disabled": {
                borderColor: "rgba(0, 0, 0, 0.12)",
                color: "rgba(0, 0, 0, 0.26)",
                cursor: "default",
              },
            },
          }}
        >
          <Tooltip title="Zoom In">
            <IconButton
              onClick={() => handleZoom(1.1)}
              disabled={!viewer}
              sx={{ color: "text.primary" }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton
              onClick={() => handleZoom(0.9)}
              disabled={!viewer}
              sx={{ color: "text.primary" }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit to Viewport">
            <IconButton
              onClick={() => {
                if (viewer) {
                  const canvas = viewer.get("canvas");
                  canvas.zoom("fit-viewport");
                  setCurrentZoom(1);
                }
              }}
              disabled={!viewer}
              sx={{ color: "text.primary" }}
            >
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* Middle section with diagram info */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 500,
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
            }}
          >
            <SchemaIcon fontSize="small" sx={{ mr: 1 }} />
            {fileName || "Process Diagram"}
          </Typography>
        </Box>

        <ButtonGroup
          size="small"
          variant="outlined"
          sx={{
            "& .MuiButtonGroup-grouped": {
              transition: "all 0.2s ease",
              "&:not(:disabled):hover": {
                bgcolor: "rgba(25, 118, 210, 0.08)",
                borderColor: "#1976d2",
              },
              "&:disabled": {
                borderColor: "rgba(0, 0, 0, 0.12)",
                color: "rgba(0, 0, 0, 0.26)",
                cursor: "default",
              },
            },
          }}
        >
          <Tooltip title="Download as PDF">
            <IconButton
              onClick={handleDownloadPdf}
              disabled={!viewer || !svg2pdfFunc || loading}
              sx={{ color: "text.primary" }}
            >
              <PictureAsPdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <IconButton
              onClick={toggleFullScreen}
              sx={{ color: "text.primary" }}
            >
              {isFullScreen ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Diagram Legend">
            <IconButton
              onClick={() => {
                showAlert(
                  "Process diagram elements: ○ Circles represent events (start/end), ◻ Rectangles are tasks, and ◻ with + are sub-processes.",
                  "info"
                );
              }}
              sx={{ color: "text.primary" }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* Pan Controls */}
      <Box
        sx={{
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          bgcolor: "rgba(255,255,255,0.9)",
          p: 0.5,
          border: "1px solid #e0e0e0",
        }}
      >
        <IconButton
          size="small"
          onClick={() => handlePan(0, 50)}
          disabled={!viewer}
        >
          <ArrowUpwardIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex" }}>
          <IconButton
            size="small"
            onClick={() => handlePan(50, 0)}
            disabled={!viewer}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handlePan(-50, 0)}
            disabled={!viewer}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Box>
        <IconButton
          size="small"
          onClick={() => handlePan(0, -50)}
          disabled={!viewer}
        >
          <ArrowDownwardIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Canvas Container */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          // Simplified container - flat design
          bgcolor: "#fff",
          border: "1px solid #e0e0e0",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              zIndex: 10,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <div ref={canvasRef} className={styles.canvasContainer}></div>
      </Box>

      {/* Global Alert */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BpmnViewer;
