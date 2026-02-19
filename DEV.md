# Development, Contributing and Self Hosting

## Development

### Prerequisites

- Docker and Docker Compose
- Copy `.env.skel` to `.env` and fill in your values (Discord tokens, database credentials, etc.)
- Create a Discord application in the Discord Developer Portal and upload emojis from `emoji/`. Put their markdown into
  `.env`.
- Clone [naagostone](https://github.com/tancred423/naagostone) and start it's containers. Add the naagostone port to
  this `.env`.

-> Naagostone is a Lodestone parser that Naago uses to find characters, their information and fetch lodestone news.

### dev.sh

You can use `./dev.sh` for all container commands (uses `docker-compose.dev.yml`):

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `./dev.sh up`       | Start all services detached             |
| `./dev.sh up:build` | Start with forced image build           |
| `./dev.sh down`     | Stop all containers                     |
| `./dev.sh purge`    | Stop and remove volumes (deletes data!) |
| `./dev.sh rebuild`  | Rebuild the app container               |
| `./dev.sh restart`  | Restart the app container               |
| `./dev.sh logs`     | Follow app logs                         |
| `./dev.sh shell`    | Attach to the app container shell       |

Workflow: start with `./dev.sh up` (or `up:build`), then `./dev.sh shell` to get a shell inside the app container. There
you can run e.g. `deno task start`, `deno task deploy-commands`, `deno task db:generate`, `deno task db:migrate` as
needed. Depending on your terminal, you might have to use `bash dev.sh <command>` instead of `./dev.sh <command>`.

phpMyAdmin is available at http://localhost:8080 (or the port set in `.env`).

## Contributing

If you want to contribute to the original repo, you can open an issue and pull request. Pull requests have to be
approved by the repo owner (tancred423) and an automatic code check will run. Make sure to run `deno fmt`, `deno lint`
and `deno check` before opening a PR.

## Production

Production runs via `docker-compose.yml` (single app service using the image from GitHub Container Registry). The deploy
workflow in `.github/workflows/deploy.yml` builds the image, pushes it to ghcr.io, copies `docker-compose.yml` to the
server and runs `docker compose up -d` there. The app expects external networks `mysql-network` and `naagostone-network`
to exist on the host. If you don't have your own database container in the mysql-network, you can also add a naago
specific one like in the `docker-compose.dev.yml`.
