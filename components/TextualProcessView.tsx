import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Button,
  Collapse,
} from "@mui/material";
import TaskIcon from "@mui/icons-material/Task";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface ProcessElement {
  id: string;
  name: string;
  type: string;
  description?: string;
  elements?: ProcessElement[];
  reference?: boolean;
}

interface Lane {
  id: string;
  name: string;
  elements: ProcessElement[];
}

interface Phase {
  id: string;
  name: string;
  type: string;
  description?: string;
  elements: ProcessElement[];
}

interface ProcessData {
  id: string;
  name: string;
  description?: string;
  type: string;
  lanes: Lane[];
  phases?: Phase[];
  flows?: any[];
}

interface ProcessStep {
  id: string;
  name: string;
  documentation: string[];
  type: string;
}

interface TextualProcessViewProps {
  xml: string;
  bpmnFileName?: string;
}

// Helper to get the right icon for each type
const getStepIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "startevent":
      return <PlayCircleOutlineIcon fontSize="small" color="success" />;
    case "endevent":
      return <StopCircleIcon fontSize="small" color="error" />;
    case "subprocess":
      return <AccountTreeIcon fontSize="small" color="primary" />;
    case "task":
    default:
      return <TaskIcon fontSize="small" color="action" />;
  }
};

// Helper to get color for type chip
const getTypeChipColor = (
  type: string
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning" => {
  const lowerType = type.toLowerCase();
  switch (true) {
    case lowerType.includes("start"):
      return "success";
    case lowerType.includes("end"):
      return "error";
    case lowerType.includes("subprocess"):
      return "primary";
    case lowerType.includes("task"):
      return "default";
    default:
      return "info";
  }
};

// Helper function to convert type to display format
const formatType = (type: string): string => {
  // Convert camelCase to Title Case with spaces
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const TextualProcessView: React.FC<TextualProcessViewProps> = ({
  xml,
  bpmnFileName,
}) => {
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [jsonData, setJsonData] = useState<ProcessData | null>(null);
  const [viewType, setViewType] = useState<string>("json"); // "xml" or "json"
  const [viewMode, setViewMode] = useState<string>("lanes"); // "lanes" or "phases"
  const [error, setError] = useState<string | null>(null);
  const [expandedElements, setExpandedElements] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleExpand = (id: string) => {
    setExpandedElements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Load JSON data based on the BPMN filename
  useEffect(() => {
    if (!bpmnFileName) return;

    const jsonFileName = bpmnFileName.replace(".bpmn", ".json");

    fetch(`/json/${jsonFileName}`)
      .then((response) => {
        if (!response.ok) {
          // If JSON doesn't exist, fall back to XML view
          console.warn(`JSON file not found: ${jsonFileName}`);
          setViewType("xml");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          setJsonData(data);
          setViewType("json");
          setError(null);

          // Initialize expanded state for subprocesses
          const expanded: { [key: string]: boolean } = {};
          if (data.lanes) {
            data.lanes.forEach((lane: Lane) => {
              lane.elements.forEach((element: ProcessElement) => {
                if (
                  element.type === "subProcess" ||
                  element.type === "subprocess"
                ) {
                  expanded[element.id] = true; // Default expanded
                }
              });
            });
          }
          setExpandedElements(expanded);
        }
      })
      .catch((err) => {
        console.error("Error loading JSON:", err);
        setViewType("xml");
      });
  }, [bpmnFileName]);

  // Parse XML if JSON view is not available
  useEffect(() => {
    if (!xml || viewType === "json") {
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, "text/xml");
      const parseError = xmlDoc.getElementsByTagName("parsererror");

      if (parseError.length > 0) {
        console.error("Error parsing BPMN XML:", parseError[0].textContent);
        setError("Failed to parse BPMN XML. Check console for details.");
        setProcessSteps([]);
        return;
      }

      const steps: ProcessStep[] = [];

      // Helper to extract documentation
      const getDocumentation = (element: Element): string[] => {
        const docs: string[] = [];
        const docElements = element.getElementsByTagName("bpmn:documentation");
        for (let i = 0; i < docElements.length; i++) {
          docs.push(docElements[i].textContent || "");
        }
        return docs;
      };

      // Extract Tasks
      const tasks = xmlDoc.getElementsByTagName("bpmn:task");
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        steps.push({
          id: task.getAttribute("id") || `task-${i}`,
          name: task.getAttribute("name") || "Unnamed Task",
          documentation: getDocumentation(task),
          type: "Task",
        });
      }

      // Extract SubProcesses
      const subProcesses = xmlDoc.getElementsByTagName("bpmn:subProcess");
      for (let i = 0; i < subProcesses.length; i++) {
        const subProcess = subProcesses[i];
        // We can also list tasks within sub-processes if desired, but for now, just the sub-process itself
        steps.push({
          id: subProcess.getAttribute("id") || `subprocess-${i}`,
          name: subProcess.getAttribute("name") || "Unnamed Sub-Process",
          documentation: getDocumentation(subProcess),
          type: "Sub-Process",
        });
      }

      // Extract Start Events
      const startEvents = xmlDoc.getElementsByTagName("bpmn:startEvent");
      for (let i = 0; i < startEvents.length; i++) {
        const event = startEvents[i];
        steps.push({
          id: event.getAttribute("id") || `start-${i}`,
          name: event.getAttribute("name") || "Unnamed Start Event",
          documentation: getDocumentation(event),
          type: "Start Event",
        });
      }

      // Extract End Events
      const endEvents = xmlDoc.getElementsByTagName("bpmn:endEvent");
      for (let i = 0; i < endEvents.length; i++) {
        const event = endEvents[i];
        steps.push({
          id: event.getAttribute("id") || `end-${i}`,
          name: event.getAttribute("name") || "Unnamed End Event",
          documentation: getDocumentation(event),
          type: "End Event",
        });
      }

      // Sort by ID to maintain some order, can be refined
      steps.sort((a, b) => a.id.localeCompare(b.id));

      setProcessSteps(steps);
      setError(null);
    } catch (e) {
      console.error("Error processing BPMN XML:", e);
      setError("An unexpected error occurred while processing the BPMN data.");
      setProcessSteps([]);
    }
  }, [xml, viewType]);

  // Render element recursively for JSON view
  const renderElement = (element: ProcessElement, indent: number = 0) => {
    const isSubProcess = element.type.toLowerCase() === "subprocess";
    const isExpanded = expandedElements[element.id] !== false; // Default to true if not set

    return (
      <React.Fragment key={element.id}>
        <ListItem
          alignItems="flex-start"
          sx={{
            flexDirection: "column",
            py: 1,
            pl: indent > 0 ? indent * 3 : 2, // Indent based on hierarchy level
            borderLeft: indent > 0 ? "1px dashed #ccc" : "none",
            ml: indent > 0 ? 2 : 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              mb: element.description ? 1 : 0,
            }}
          >
            {isSubProcess && element.elements && element.elements.length > 0 ? (
              <Button
                size="small"
                onClick={() => toggleExpand(element.id)}
                sx={{ minWidth: 30, p: 0.5 }}
              >
                {isExpanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </Button>
            ) : (
              <Box sx={{ width: 30 }}>{getStepIcon(element.type)}</Box>
            )}

            <Typography
              variant={isSubProcess ? "subtitle1" : "body1"}
              sx={{
                ml: 1,
                flex: 1,
                fontWeight: isSubProcess ? "bold" : "normal",
                color: element.reference ? "text.secondary" : "text.primary",
              }}
            >
              {element.name}
            </Typography>

            <Chip
              label={formatType(element.type)}
              size="small"
              color={getTypeChipColor(element.type)}
              variant={element.reference ? "outlined" : "filled"}
              sx={{ opacity: element.reference ? 0.7 : 1 }}
            />

            {element.reference && (
              <Chip
                label="Reference"
                size="small"
                color="default"
                variant="outlined"
                sx={{ ml: 1, opacity: 0.7 }}
              />
            )}
          </Box>

          {element.description && (
            <Paper
              variant="outlined"
              sx={{
                width: "calc(100% - 30px)",
                p: 1.5,
                ml: 3.5,
                bgcolor: "background.paper",
                mb: 1,
              }}
            >
              <Typography variant="body2">{element.description}</Typography>
            </Paper>
          )}

          {isSubProcess &&
            element.elements &&
            element.elements.length > 0 &&
            isExpanded && (
              <Box sx={{ width: "100%", mt: 1 }}>
                {element.elements.map((childElement) =>
                  renderElement(childElement, indent + 1)
                )}
              </Box>
            )}
        </ListItem>
      </React.Fragment>
    );
  };

  // Render JSON view
  const renderJsonView = () => {
    if (!jsonData) return null;

    return (
      <>
        {jsonData.description && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: "background.paper" }}>
            <Typography variant="body1">{jsonData.description}</Typography>
          </Paper>
        )}

        {jsonData.phases && jsonData.phases.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={viewMode}
              onChange={(_, newValue) => setViewMode(newValue)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab value="lanes" label="Swim Lanes View" />
              <Tab value="phases" label="Phases View" />
            </Tabs>
          </Box>
        )}

        {viewMode === "lanes"
          ? // Lanes View
            jsonData.lanes.map((lane) => (
              <Box key={lane.id} sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    p: 1,
                    borderRadius: "4px 4px 0 0",
                  }}
                >
                  {lane.name}
                </Typography>

                <List
                  sx={{
                    width: "100%",
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    borderTopWidth: 0,
                    borderRadius: "0 0 4px 4px",
                    overflow: "hidden",
                  }}
                >
                  {lane.elements.map((element, index) => (
                    <React.Fragment key={element.id}>
                      {index > 0 && <Divider component="li" />}
                      {renderElement(element)}
                    </React.Fragment>
                  ))}

                  {lane.elements.length === 0 && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary">
                        No elements in this lane
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Box>
            ))
          : // Phases View
            jsonData.phases?.map((phase) => (
              <Box key={phase.id} sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                    p: 1,
                    borderRadius: "4px 4px 0 0",
                  }}
                >
                  {phase.name}
                </Typography>

                {phase.description && (
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: 0,
                      borderLeft: "1px solid",
                      borderRight: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2">{phase.description}</Typography>
                  </Paper>
                )}

                <List
                  sx={{
                    width: "100%",
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    borderTopWidth: phase.description ? 0 : 1,
                    borderRadius: phase.description
                      ? "0 0 4px 4px"
                      : "0 0 4px 4px",
                    overflow: "hidden",
                  }}
                >
                  {phase.elements.map((element, index) => (
                    <React.Fragment key={element.id}>
                      {index > 0 && <Divider component="li" />}
                      {renderElement(element)}
                    </React.Fragment>
                  ))}

                  {phase.elements.length === 0 && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary">
                        No elements in this phase
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Box>
            ))}
      </>
    );
  };

  // Render XML view (legacy)
  const renderXmlView = () => {
    return (
      <List sx={{ width: "100%" }}>
        {processSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            {index > 0 && <Divider variant="inset" component="li" />}
            <ListItem
              alignItems="flex-start"
              sx={{ flexDirection: "column", py: 2 }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  mb: 1,
                }}
              >
                {getStepIcon(step.type)}
                <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                  {step.name}
                </Typography>
                <Chip
                  label={step.type}
                  size="small"
                  color={getTypeChipColor(step.type)}
                  variant="outlined"
                />
              </Box>

              {step.documentation.length > 0 ? (
                <Paper
                  variant="outlined"
                  sx={{ width: "100%", p: 2, bgcolor: "background.paper" }}
                >
                  {step.documentation.map((doc, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      paragraph={index < step.documentation.length - 1}
                    >
                      {doc}
                    </Typography>
                  ))}
                </Paper>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "text.secondary",
                    mt: 1,
                  }}
                >
                  <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">
                    No detailed description provided in the BPMN.
                  </Typography>
                </Box>
              )}
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  };

  if (error) {
    return (
      <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (
    (processSteps.length === 0 && !xml) ||
    (!jsonData && viewType === "json" && !xml)
  ) {
    return (
      <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
        <Alert severity="info">No process data loaded.</Alert>
      </Box>
    );
  }

  if (processSteps.length === 0 && viewType === "xml" && xml) {
    return (
      <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
        <Alert severity="info">
          Loading process steps or no standard elements found...
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Process Steps & Details
      </Typography>

      {viewType === "json" && jsonData ? renderJsonView() : renderXmlView()}

      {viewType === "xml" && jsonData && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setViewType("json")}
          >
            Switch to Enhanced Hierarchical View
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default TextualProcessView;
