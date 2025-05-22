import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  Collapse,
  Tooltip,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AIProps {
  processData: any;
  onClose: () => void;
}

const AIPanel: React.FC<AIProps> = ({ processData, onClose }) => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [userScrolled, setUserScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    // Initialize chat with a welcome message
    if (processData && chatHistory.length === 0) {
      // Add welcome message instead of calling API
      const welcomeMessage: Message = {
        role: "assistant",
        content:
          "Welcome to the Process AI Assistant! I'm here to help you understand this business process. You can ask me questions like:\n\n• What is this process about?\n• What are the main phases of this process?\n• Who are the key stakeholders?\n• What are the critical tasks?\n• How long does this process typically take?\n\nWhat would you like to know about this process?",
      };
      setChatHistory([welcomeMessage]);
    }
  }, [processData]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamedContent]);

  // Handle scroll events to detect manual user scrolling
  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const bottomThreshold = 150; // pixels from bottom to consider "at bottom"

    // Check if user has scrolled up away from bottom
    const isAtBottom =
      scrollHeight - scrollTop - clientHeight < bottomThreshold;

    // Update the userScrolled state based on scroll position
    setUserScrolled(!isAtBottom);
  };

  const scrollToBottom = () => {
    // Don't auto-scroll if user has manually scrolled up and is still streaming
    if (userScrolled && isStreaming) {
      return;
    }

    if (messagesEndRef.current && chatContainerRef.current) {
      // For smooth scrolling when adding new messages
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });

      // Force scroll as a fallback
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  // Reset userScrolled when a new message is sent
  useEffect(() => {
    if (!isStreaming) {
      setUserScrolled(false);
    }
  }, [isStreaming]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    setChatHistory([...chatHistory, userMessage]);
    setMessage("");
    setLoading(true);
    setError(null);
    setIsStreaming(true);
    setStreamedContent("");

    try {
      // Use EventSource for SSE (Server-Sent Events)
      const eventSourceInitDict = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processData,
          message: userMessage.content,
          chatHistory,
        }),
      };

      // Create a function to handle the streaming
      const handleStream = async () => {
        const response = await fetch("/api/chat", eventSourceInitDict);

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get response reader");
        }

        const decoder = new TextDecoder();
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode and process the chunk
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                // Streaming is complete
                setChatHistory((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: accumulatedContent,
                  },
                ]);
                setIsStreaming(false);
                setStreamedContent("");
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setStreamedContent(accumulatedContent);
                  // Ensure we scroll when new content arrives
                  setTimeout(scrollToBottom, 10);
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.error("Error parsing chunk:", e, data);
              }
            }
          }
        }
      };

      await handleStream();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to get a response. Please try again later.");
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        bgcolor: "#f5f8fa",
        borderRadius: 1,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1.5,
          bgcolor: theme.palette.primary.main,
          color: "white",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              bgcolor: "white",
              color: theme.palette.primary.main,
              width: 32,
              height: 32,
              mr: 1.5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <SmartToyIcon fontSize="small" />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600}>
            Process AI Assistant
          </Typography>
        </Box>
        <Box>
          <Tooltip title={expanded ? "Collapse" : "Expand"}>
            <IconButton
              size="small"
              onClick={toggleExpanded}
              sx={{ color: "white", mr: 0.5 }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Input Area - Absolutely positioned at bottom */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "white",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
          zIndex: 2,
          display: expanded ? "block" : "none",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about this process..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
            size="small"
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "white",
                borderRadius: "1.5rem",
                px: 1.5,
                py: 0.5,
                "&.Mui-focused fieldset": {
                  borderWidth: "1px",
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || loading}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: "white",
              width: 45,
              height: 45,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
              "&.Mui-disabled": {
                bgcolor: "action.disabledBackground",
                color: "action.disabled",
              },
              borderRadius: "50%",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mt: 1,
            color: "text.secondary",
            gap: 0.5,
          }}
        >
          <AutoAwesomeIcon fontSize="inherit" />
          Powered by OpenAI
        </Typography>
      </Box>

      {/* Chat Messages - Scrollable Area */}
      <Box
        ref={chatContainerRef}
        onScroll={handleScroll}
        sx={{
          position: "absolute",
          top: 64,
          bottom: expanded ? 121 : 0,
          left: 0,
          right: 0,
          overflowY: "auto",
          p: 2,
          display: expanded ? "flex" : "none",
          flexDirection: "column",
          gap: 2,
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": {
            background: "rgba(0,0,0,0.05)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.15)",
            borderRadius: "4px",
            "&:hover": { background: "rgba(0,0,0,0.25)" },
          },
        }}
      >
        {chatHistory.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1.5,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              opacity: 1,
              animation: "fadeIn 0.3s",
              "@keyframes fadeIn": {
                "0%": {
                  opacity: 0,
                  transform: "translateY(10px)",
                },
                "100%": {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            {msg.role === "assistant" && (
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 36,
                  height: 36,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <SmartToyIcon fontSize="small" />
              </Avatar>
            )}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor:
                  msg.role === "user"
                    ? `${theme.palette.primary.main}`
                    : "white",
                color: msg.role === "user" ? "white" : "text.primary",
                boxShadow:
                  msg.role === "user"
                    ? "0 2px 8px rgba(25, 118, 210, 0.15)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
              >
                {msg.content}
              </Typography>
            </Paper>
            {msg.role === "user" && (
              <Avatar
                sx={{
                  bgcolor: theme.palette.grey[600],
                  width: 36,
                  height: 36,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <PersonIcon fontSize="small" />
              </Avatar>
            )}
          </Box>
        ))}

        {/* Streaming content */}
        {isStreaming && streamedContent && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1.5,
              alignSelf: "flex-start",
              maxWidth: "85%",
              opacity: 1,
              animation: "fadeIn 0.3s",
              mb: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 36,
                height: 36,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "white",
                color: "text.primary",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
              >
                {streamedContent}
              </Typography>
            </Paper>
          </Box>
        )}

        {loading &&
          !isStreaming &&
          (!chatHistory.length ||
            chatHistory[chatHistory.length - 1].role === "user") && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

        {isStreaming && !streamedContent && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1.5,
              alignSelf: "flex-start",
              maxWidth: "85%",
              opacity: 1,
              animation: "fadeIn 0.3s",
              mb: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 36,
                height: 36,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "white",
                color: "text.primary",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography
                  variant="body2"
                  sx={{ fontStyle: "italic", color: "text.secondary" }}
                >
                  Thinking...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {error && (
          <Box
            sx={{
              my: 2,
              p: 2,
              bgcolor: "#ffebee",
              borderRadius: 2,
              border: "1px solid #ffcdd2",
            }}
          >
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>
    </Paper>
  );
};

export default AIPanel;
