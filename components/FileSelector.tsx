import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Paper,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";

interface FileSelectorProps {
  fileList: string[];
  selectedFile: string | null; // Can be null if no file is selected
  onFileSelect: (filename: string) => void;
  onFileUploaded: () => void; // Callback after upload attempt
  fetchFileList: () => Promise<void>; // Function to refresh the file list
}

const FileSelector: React.FC<FileSelectorProps> = ({
  fileList,
  selectedFile,
  onFileSelect,
  onFileUploaded,
  fetchFileList,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch file list on initial mount if it hasn't been populated yet
  // This is a fallback in case the parent component doesn't fetch it immediately
  // However, the primary responsibility for fetching is now with the parent (Home.tsx)
  useEffect(() => {
    if (fileList.length === 0) {
      // fetchFileList(); // Decided to let parent handle initial fetch to avoid double calls
    }
  }, [fileList.length, fetchFileList]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    const formData = new FormData();
    formData.append("bpmnfile", file);

    try {
      const response = await fetch("/api/upload-bpmn-file", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `Failed to upload file: ${response.statusText}`
        );
      }

      setUploadSuccess(`File '${file.name}' uploaded successfully!`);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
      onFileUploaded(); // Notify parent
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(
        err.message || "An unexpected error occurred during upload."
      );
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Available BPMN Files
      </Typography>

      {fileList.length === 0 && !uploading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No BPMN files found in the /public/bpmn directory. Upload one to get
          started.
        </Alert>
      )}

      <Box sx={{ mb: 2, flexGrow: 1, overflow: "auto" }}>
        <List
          sx={{
            bgcolor: "background.paper",
            borderRadius: 1,
            "& .MuiListItemButton-root": {
              transition: "all 0.2s ease",
              pl: 2,
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(25, 118, 210, 0.08)",
                transform: "translateX(4px)",
              },
              "&.Mui-selected": {
                bgcolor: "rgba(25, 118, 210, 0.12)",
                borderLeft: "4px solid #1976d2",
                "&:hover": {
                  bgcolor: "rgba(25, 118, 210, 0.18)",
                },
              },
            },
            // If there are no files, show a message
            ...(!fileList.length && {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100px",
              color: "text.secondary",
              fontStyle: "italic",
            }),
          }}
        >
          {fileList.map((file) => (
            <ListItemButton
              key={file}
              selected={selectedFile === file}
              onClick={() => onFileSelect(file)}
              sx={{
                borderLeft:
                  selectedFile === file
                    ? "4px solid #1976d2"
                    : "4px solid transparent",
              }}
            >
              <ListItemText
                primary={file}
                primaryTypographyProps={{
                  fontWeight: selectedFile === file ? 500 : 400,
                  fontSize: "0.95rem",
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: "auto" }}>
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        )}

        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {uploadSuccess}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 1,
            "& .MuiButton-root": {
              flex: 1,
              minWidth: "120px",
              height: "40px",
              transition: "all 0.2s ease-in-out",
              "&:not(:disabled):hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              },
              "&:disabled": {
                backgroundColor: "rgba(0, 0, 0, 0.12)",
                color: "rgba(0, 0, 0, 0.26)",
              },
            },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={triggerFileInput}
            disabled={uploading}
            sx={{
              whiteSpace: "nowrap",
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            {uploading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : (
              "Upload BPMN"
            )}
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchFileList}
            title="Refresh file list"
            sx={{
              whiteSpace: "nowrap",
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Refresh
          </Button>
        </Box>

        <input
          type="file"
          accept=".bpmn"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
      </Box>
    </Box>
  );
};

export default FileSelector;
