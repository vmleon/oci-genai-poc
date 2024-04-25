import { useState, useEffect } from "react";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";
import PromptInput from "./PromptInput";
import Conversation from "./Conversation";
import { useStomp } from "./stompHook";
import { v4 as uuidv4 } from "uuid";

const conversationId = uuidv4();

function Chat() {
  const [conversation, setConversation] = useState([]);
  const [promptValue, setPromptValue] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const { subscribe, unsubscribe, send, isConnected } = useStomp();

  useEffect(() => {
    let timeoutId;
    if (waiting) {
      timeoutId = setTimeout(() => {
        setWaiting(false);
        setShowError(true);
        setErrorMessage("Request timeout");
      }, 10000);
    } else {
    }
    return () => (timeoutId ? clearTimeout(timeoutId) : null);
  }, [waiting]);

  useEffect(() => {
    if (isConnected) {
      subscribe("/user/queue/answer", (message) => {
        setWaiting(false);
        if (message.errorMessage.length > 0) {
          setErrorMessage(message.errorMessage);
          setShowError(true);
        } else {
          setConversation((c) => [
            ...c,
            {
              id: c.length + 1,
              user: "ai",
              content: message.content,
            },
          ]);
        }
      });
    }

    return () => {
      unsubscribe("/user/queue/answer");
    };
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && promptValue.length) {
      send("/genai/prompt", { conversationId, content: promptValue });
      setWaiting(true);
      setPromptValue("");
    }
    return () => {};
  }, [promptValue]);

  return (
    <Box>
      {/* {isConnected && <Alert>Connected</Alert>} */}
      <Conversation>{conversation}</Conversation>
      {waiting && <CircularProgress style={{ padding: "1rem" }} />}
      <PromptInput
        setConversation={setConversation}
        setPromptValue={setPromptValue}
        disabled={waiting}
      ></PromptInput>
      <Snackbar
        open={showError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={6000}
        onClose={() => {
          setErrorMessage();
          setShowError(false);
        }}
        message={errorMessage}
      />
    </Box>
  );
}

export default Chat;
