import { Container, Typography } from "@mui/material";
import { StompProvider } from "./stompHook";
import Chat from "./Chat";

function App() {
  return (
    <StompProvider config={{ brokerURL: "ws://localhost:8080/websocket" }}>
      <Container>
        <Typography variant="h1" component="h2">
          OCI GenAI PoC
        </Typography>
        <Chat />
      </Container>
    </StompProvider>
  );
}

export default App;
