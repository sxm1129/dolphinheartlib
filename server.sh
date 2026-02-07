#!/usr/bin/env bash
# HeartLib service control: start/stop/status/restart
# studio=dolphinheartmula-studio:10000, frontend=frontend/:10002, backend:10001
# Usage: ./server.sh <start|stop|status|restart> <studio|frontend|backend|all>

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
STUDIO_PORT=10000
FRONTEND_PORT=10002
BACKEND_PORT=10001
PID_DIR="${ROOT}/.server"
STUDIO_PID="${PID_DIR}/studio.pid"
FRONTEND_PID="${PID_DIR}/frontend.pid"
BACKEND_PID="${PID_DIR}/backend.pid"

mkdir -p "$PID_DIR"

# Kill process(es) using the given port.
kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Stopping process(es) on port $port (PIDs: $pids)"
    kill -9 $pids 2>/dev/null || true
  fi
}

# Return 0 if something is listening on port; output PID.
port_in_use() {
  local pids
  pids=$(lsof -ti ":$1" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "$pids" | head -1
    return 0
  fi
  return 1
}

print_status() {
  local name=$1
  local port=$2
  if port_in_use "$port" >/dev/null; then
    local pid=$(port_in_use "$port")
    echo "$name: running (port $port, PID $pid)"
    return 0
  else
    echo "$name: stopped (port $port)"
    return 1
  fi
}

start_studio() {
  if port_in_use "$STUDIO_PORT" >/dev/null; then
    echo "Studio already running on port $STUDIO_PORT"
    return 0
  fi
  echo "Starting studio (dolphinheartmula-studio) on port $STUDIO_PORT ..."
  (cd "$ROOT/dolphinheartmula-studio" && npm run dev) &
  echo $! > "$STUDIO_PID"
  sleep 2
  if port_in_use "$STUDIO_PORT" >/dev/null; then
    echo "Studio started (port $STUDIO_PORT)"
  else
    echo "Studio may still be starting; check logs."
  fi
}

start_frontend() {
  if port_in_use "$FRONTEND_PORT" >/dev/null; then
    echo "Frontend already running on port $FRONTEND_PORT"
    return 0
  fi
  echo "Starting frontend on port $FRONTEND_PORT ..."
  (cd "$ROOT/frontend" && npm run dev) &
  echo $! > "$FRONTEND_PID"
  sleep 2
  if port_in_use "$FRONTEND_PORT" >/dev/null; then
    echo "Frontend started (port $FRONTEND_PORT)"
  else
    echo "Frontend may still be starting; check logs."
  fi
}

start_backend() {
  if port_in_use "$BACKEND_PORT" >/dev/null; then
    echo "Backend already running on port $BACKEND_PORT"
    return 0
  fi
  echo "Starting backend on port $BACKEND_PORT ..."
  cd "$ROOT"
  if command -v conda &>/dev/null && conda env list | grep -q heartlib_env; then
    conda run -n heartlib_env --no-capture-output uvicorn server.main:app --host 0.0.0.0 --port "$BACKEND_PORT" &
  else
    uvicorn server.main:app --host 0.0.0.0 --port "$BACKEND_PORT" &
  fi
  echo $! > "$BACKEND_PID"
  sleep 2
  if port_in_use "$BACKEND_PORT" >/dev/null; then
    echo "Backend started (port $BACKEND_PORT)"
  else
    echo "Backend may still be starting; check logs."
  fi
}

stop_studio() {
  kill_port "$STUDIO_PORT"
  rm -f "$STUDIO_PID"
  echo "Studio stopped."
}

stop_frontend() {
  kill_port "$FRONTEND_PORT"
  rm -f "$FRONTEND_PID"
  echo "Frontend stopped."
}

stop_backend() {
  kill_port "$BACKEND_PORT"
  rm -f "$BACKEND_PID"
  echo "Backend stopped."
}

cmd_start() {
  case "$1" in
    studio)    start_studio ;;
    frontend)  start_frontend ;;
    backend)   start_backend ;;
    all)       start_backend; start_studio; start_frontend ;;
    *)         echo "Unknown target: $1. Use studio|frontend|backend|all"; exit 1 ;;
  esac
}

cmd_stop() {
  case "$1" in
    studio)    stop_studio ;;
    frontend)  stop_frontend ;;
    backend)   stop_backend ;;
    all)       stop_studio; stop_frontend; stop_backend ;;
    *)         echo "Unknown target: $1. Use studio|frontend|backend|all"; exit 1 ;;
  esac
}

cmd_status() {
  echo "---"
  print_status "Studio (dolphinheartmula-studio)" "$STUDIO_PORT" || true
  print_status "Frontend (frontend/)"            "$FRONTEND_PORT" || true
  print_status "Backend"                         "$BACKEND_PORT"  || true
  echo "---"
}

cmd_restart() {
  case "$1" in
    studio)    stop_studio; start_studio ;;
    frontend)  stop_frontend; start_frontend ;;
    backend)   stop_backend; start_backend ;;
    all)       stop_studio; stop_frontend; stop_backend; start_backend; start_studio; start_frontend ;;
    *)         echo "Unknown target: $1. Use studio|frontend|backend|all"; exit 1 ;;
  esac
}

ACTION="${1:-}"
TARGET="${2:-all}"

case "$ACTION" in
  start)   cmd_start "$TARGET" ;;
  stop)    cmd_stop "$TARGET" ;;
  status)  cmd_status ;;
  restart) cmd_restart "$TARGET" ;;
  *)
    echo "Usage: $0 <start|stop|status|restart> [studio|frontend|backend|all]"
    echo "  studio   = dolphinheartmula-studio (port $STUDIO_PORT)"
    echo "  frontend = frontend/ (port $FRONTEND_PORT)"
    echo "  backend  = port $BACKEND_PORT"
    echo "  all      = backend + studio + frontend (default)"
    exit 1
    ;;
esac
