#!/usr/bin/env bash
set -e
COMPOSE_FILE="docker-compose.dev.yml"

case "${1:-}" in
  up)
    docker compose -f "$COMPOSE_FILE" up -d
    ;;
  up:build)
    docker compose -f "$COMPOSE_FILE" up -d --build
    ;;
  down)
    docker compose -f "$COMPOSE_FILE" down
    ;;
  purge)
    docker compose -f "$COMPOSE_FILE" down -v
    ;;
  rebuild)
    docker compose -f "$COMPOSE_FILE" up -d --build app
    ;;
  restart)
    docker compose -f "$COMPOSE_FILE" restart app
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f app
    ;;
  shell)
    docker exec -it naago-app-dev /bin/bash
    ;;
  *)
    echo "Usage: $0 {up|up:build|down|purge|rebuild|restart|logs|shell}"
    exit 1
    ;;
esac
