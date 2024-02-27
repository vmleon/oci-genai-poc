import { Container, Typography } from "@mui/material";
import { StompProvider } from "./stompHook";
import Chat from "./Chat";

const WEBSOCKET_BACKEND_URL = import.meta.env.VITE_WEBSOCKET_BACKEND_URL;

function App() {
  return (
    <StompProvider
      config={{
        brokerURL:
          WEBSOCKET_BACKEND_URL || `wss://${window.location.host}/websocket`,
      }}
    >
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
