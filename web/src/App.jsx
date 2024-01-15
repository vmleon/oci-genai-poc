import { useState, useEffect, useRef } from "react";
import Button from "@mui/material/Button";
import { deepOrange, deepPurple } from "@mui/material/colors";
import "./App.css";
import {
  Avatar,
  Box,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function App() {
  const [conversation, setConversation] = useState([]);

  useEffect(() => {
    if (
      conversation.length &&
      conversation[conversation.length - 1].user === "me"
    ) {
      setConversation((c) => [
        ...c,
        {
          id: c.length + 1,
          user: "ai",
          content: `The answer to ${c[c.length - 1].content} is 42`,
        },
      ]);
    }
    return () => {};
  }, [conversation]);

  return (
    <Container>
      <Typography variant="h1" component="h2">
        OCI GenAI PoC
      </Typography>
      <Conversation>{conversation}</Conversation>
      <Prompt setConversation={setConversation}></Prompt>
    </Container>
  );
}

function Prompt({ setConversation }) {
  const [inputValue, setInputValue] = useState("");
  const textRef = useRef();
  return (
    <Stack direction={"row"}>
      <TextField
        id="prompt"
        label="Prompt"
        variant="outlined"
        sx={{ width: "50ch" }}
        value={inputValue}
        inputRef={textRef}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Button
        variant="contained"
        onClick={() => {
          setConversation((c) => {
            return [
              ...c,
              {
                id: c.length + 1,
                user: "me",
                content: inputValue,
              },
            ];
          });
          setInputValue("");
        }}
      >
        Send
      </Button>
    </Stack>
  );
}

function Conversation({ children: conversation }) {
  if (!conversation.length) return;
  return (
    <Paper elevation={2} style={{ padding: "1rem", marginBottom: "1rem" }}>
      <Stack spacing={1} direction={"column"}>
        {conversation.map(({ id, user, content }) => {
          return (
            <Stack direction={"row"} alignItems="center" spacing={1} key={id}>
              {user === "ai" ? <AIAvatar /> : <MeAvatar />}
              <Typography>{content}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

function AIAvatar() {
  return <Avatar sx={{ bgcolor: deepOrange[500] }}>AI</Avatar>;
}

function MeAvatar() {
  return <Avatar sx={{ bgcolor: deepPurple[500] }}>Me</Avatar>;
}

export default App;
