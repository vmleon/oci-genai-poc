# Run Local

## Web

Run locally with

```bash
cd web
```

```bash
VITE_WEBSOCKET_BACKEND_URL="/websocket" npm run dev
```

## Backend

Run locally with

```bash
cd backend
```

Edit `/backend/src/main/resources/application.yaml` to have the correct values.

```bash
./gradlew bootRun
```
