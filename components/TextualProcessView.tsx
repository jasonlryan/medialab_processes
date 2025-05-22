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
} from "@mui/material";
import TaskIcon from "@mui/icons-material/Task";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import InfoIcon from "@mui/icons-material/Info";

interface ProcessStep {
  id: string;
  name: string;
  documentation: string[];
  type: string;
}

interface TextualProcessViewProps {
  xml: string;
}

// Helper to get the right icon for each type
const getStepIcon = (type: string) => {
  switch (type) {
    case "Start Event":
      return <PlayCircleOutlineIcon fontSize="small" color="success" />;
    case "End Event":
      return <StopCircleIcon fontSize="small" color="error" />;
    case "Sub-Process":
      return <AccountTreeIcon fontSize="small" color="primary" />;
    case "Task":
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
  switch (type) {
    case "Start Event":
      return "success";
    case "End Event":
      return "error";
    case "Sub-Process":
      return "primary";
    case "Task":
    default:
      return "default";
  }
};

const TextualProcessView: React.FC<TextualProcessViewProps> = ({ xml }) => {
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!xml) {
      setProcessSteps([]);
      setError(null);
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
  }, [xml]);

  if (error) {
    return (
      <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (processSteps.length === 0 && !xml) {
    return (
      <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
        <Alert severity="info">No BPMN data loaded.</Alert>
      </Box>
    );
  }

  if (processSteps.length === 0 && xml) {
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
                  <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    No detailed description provided in the BPMN.
                  </Typography>
                </Box>
              )}
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default TextualProcessView;
