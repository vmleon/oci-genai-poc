import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import PromptInput from "./PromptInput";
import Conversation from "./Conversation";
import { useStomp } from "./stompHook";

function Chat() {
  const [conversation, setConversation] = useState([]);
  const [promptValue, setPromptValue] = useState("");
  const { subscribe, unsubscribe, subscriptions, send, isConnected } =
    useStomp();

  useEffect(() => {
    if (isConnected) {
      subscribe("/user/queue/answer", (message) => {
        setConversation((c) => [
          ...c,
          {
            id: c.length + 1,
            user: "ai",
            content: message.content,
          },
        ]);
      });
    }

    return () => {
      unsubscribe("/user/queue/answer");
    };
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && promptValue.length) {
      send("/genai/prompt", { content: promptValue });
      setPromptValue("");
    }
    return () => {};
  }, [promptValue]);

  return (
    <Box>
      <Conversation>{conversation}</Conversation>
      <PromptInput
        setConversation={setConversation}
        setPromptValue={setPromptValue}
      ></PromptInput>
    </Box>
  );
}

export default Chat;
