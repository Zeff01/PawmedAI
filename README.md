# Pawmed AI

Animal disease image classification with a Django REST API (Gemini via LangChain) and a React UI.

## Prerequisites

- Docker Desktop
- Docker Compose v2

## Environment Setup

Server: `/Users/philip/Desktop/PawmedAI/server/.env.development`

```
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Client: `/Users/philip/Desktop/PawmedAI/client/.env.development`

```
VITE_UC_PUB_KEY=...
```

Optional for production:

`/Users/philip/Desktop/PawmedAI/server/.env.production`

```
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

`/Users/philip/Desktop/PawmedAI/client/.env.production`

```
VITE_UC_PUB_KEY=...
```

## Run (Development)

From the repo root:

```bash
docker compose --profile dev up -d --build
```

Services:

- API: `http://localhost:8000`
- Client: `http://localhost:3000`

## Run (Production)

```bash
docker compose --profile prod up -d --build
```

Services:

- API via Nginx: `http://localhost:8000`
- Client: `http://localhost:3000`

## Test the API (Postman)

Endpoint:

```
POST http://localhost:8000/api/disease-classify/
```

Body (form-data):

- Key: `image` (type: File)
- Value: `<your-image-file>`

## Notes

- The client uses Uploadcare’s widget for file selection, but preserves the custom UI.
- If dependencies change in the client, rebuild with:

```bash
docker compose --profile dev up -d --build client-dev
```
