import { Button, Stack, TextField } from "@mui/material";
import { useState, useRef } from "react";

function PromptInput({ setConversation, setPromptValue }) {
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
          setPromptValue(inputValue);
          setInputValue("");
        }}
      >
        Send
      </Button>
    </Stack>
  );
}

export default PromptInput;
