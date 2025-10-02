
# Pawmed Container Environment Setup

The **PawMed Container Environment Setup** uses Docker Compose to build and run both client and server images. It was created to prevent dependency version conflicts and minimize the 'it works on my device' issue previously encountered by the PawMed team.

📌 Make sure you already pulled the latest changes from the repository

**Build the image via `docker-compose` command**
```bash
docker-compose --profile dev build --no-cache
```

- `build` — builds the images defined in the docker-compose.yml file.
- `--no-cache` - forces Docker to build the images from scratch, ignoring any cached layers.
- `--profile dev` - specifies the `dev` profile, which builds the development images for both client and server.

**Start the Container**
```bash
docker-compose --profile dev up -d
```

- `up` - creates and starts the containers.
- `-d` - runs containers in detached mode (in the background), so logs don’t occupy your terminal.
