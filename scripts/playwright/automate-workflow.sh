#!/usr/bin/env bash
set -euo pipefail

if ! command -v npx >/dev/null 2>&1; then
  cat <<'EOF'
npx is required but was not found.

# Verify Node/npm are installed
node --version
npm --version

# If missing, install Node.js/npm, then:
npm install -g @playwright/cli@latest
playwright-cli --help
EOF
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="${PWCLI:-$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh}"
SCREENSHOT_PY="${SCREENSHOT_PY:-$CODEX_HOME/skills/screenshot/scripts/take_screenshot.py}"

if [[ ! -x "$PWCLI" ]]; then
  echo "Playwright wrapper not found or not executable: $PWCLI" >&2
  exit 1
fi

BASE_URL="${BASE_URL:-http://localhost:3000}"
SESSION="${PLAYWRIGHT_SESSION:-revisional-workflow}"
EMAIL="${WORKFLOW_EMAIL:-}"
PASSWORD="${WORKFLOW_PASSWORD:-}"
CAPTURE_OS_SCREENSHOTS="${CAPTURE_OS_SCREENSHOTS:-0}"
HEADED="${HEADED:-1}"

RUN_ID="$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/output/playwright/revisional-workflow/$RUN_ID}"
mkdir -p "$OUTPUT_DIR"

if [[ "$CAPTURE_OS_SCREENSHOTS" == "1" ]] && [[ ! -f "$SCREENSHOT_PY" ]]; then
  echo "screenshot helper not found: $SCREENSHOT_PY" >&2
  exit 1
fi

log() {
  printf '[workflow] %s\n' "$*"
}

pw() {
  PLAYWRIGHT_CLI_SESSION="$SESSION" "$PWCLI" "$@"
}

latest_snapshot_file() {
  ls -t .playwright-cli/page-*.yml 2>/dev/null | head -1
}

extract_ref_from_latest_snapshot() {
  local regex="$1"
  local snapshot_file
  snapshot_file="$(latest_snapshot_file)"
  if [[ -z "$snapshot_file" ]]; then
    return 1
  fi
  local line
  line="$(rg -n "$regex" "$snapshot_file" -m1 | head -1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  printf "%s\n" "$line" | sed -E 's/.*\[ref=(e[0-9]+)\].*/\1/'
}

capture_state() {
  local name="$1"
  log "Capturing browser screenshot: $name"
  pw screenshot | tee -a "$OUTPUT_DIR/commands.log"

  if [[ "$CAPTURE_OS_SCREENSHOTS" == "1" ]]; then
    log "Capturing OS screenshot: $name"
    python3 "$SCREENSHOT_PY" --path "$OUTPUT_DIR/os-${name}.png" --active-window
  fi
}

open_page() {
  local url="$1"
  log "Opening: $url"
  if [[ "$HEADED" == "1" ]]; then
    pw open "$url" --headed | tee -a "$OUTPUT_DIR/commands.log"
  else
    pw open "$url" | tee -a "$OUTPUT_DIR/commands.log"
  fi
  sleep 1
  pw snapshot | tee -a "$OUTPUT_DIR/commands.log"
}

navigate_by_link() {
  local label="$1"
  local tag="$2"
  local link_ref=""

  pw snapshot | tee -a "$OUTPUT_DIR/commands.log"
  link_ref="$(extract_ref_from_latest_snapshot "link \"$label\"")"
  if [[ -z "$link_ref" ]]; then
    echo "Could not resolve sidebar link ref for label: $label" >&2
    exit 1
  fi

  log "Navigating via sidebar link: $label ($link_ref)"
  pw click "$link_ref" | tee -a "$OUTPUT_DIR/commands.log"
  sleep 1
  pw snapshot | tee -a "$OUTPUT_DIR/commands.log"
  capture_state "$tag"
}

cleanup() {
  pw close >/dev/null 2>&1 || true
}
trap cleanup EXIT

cd "$OUTPUT_DIR"
log "Artifacts: $OUTPUT_DIR"
log "Session: $SESSION"

open_page "$BASE_URL/login"
capture_state "01-login-loaded"

if [[ -n "$EMAIL" && -n "$PASSWORD" ]]; then
  EMAIL_REF=""
  PASSWORD_REF=""
  SUBMIT_REF=""

  EMAIL_REF="$(extract_ref_from_latest_snapshot 'textbox "E-mail"')"
  PASSWORD_REF="$(extract_ref_from_latest_snapshot 'textbox "Senha"')"
  SUBMIT_REF="$(extract_ref_from_latest_snapshot 'button "Entrar"')"

  if [[ -z "$EMAIL_REF" || -z "$PASSWORD_REF" || -z "$SUBMIT_REF" ]]; then
    echo "Could not resolve login refs from snapshot." >&2
    exit 1
  fi

  log "Filling login form"
  pw fill "$EMAIL_REF" "$EMAIL" | tee -a "$OUTPUT_DIR/commands.log"
  pw fill "$PASSWORD_REF" "$PASSWORD" | tee -a "$OUTPUT_DIR/commands.log"
  sleep 1
  pw snapshot | tee -a "$OUTPUT_DIR/commands.log"
  capture_state "02-login-filled"

  log "Submitting login form"
  pw click "$SUBMIT_REF" | tee -a "$OUTPUT_DIR/commands.log"
  sleep 2
  pw snapshot | tee -a "$OUTPUT_DIR/commands.log"
  capture_state "03-dashboard-after-login"
else
  log "Skipping sign-in (WORKFLOW_EMAIL/WORKFLOW_PASSWORD not set)"
fi

navigate_by_link "Dashboard" "04-dashboard"
navigate_by_link "Revisional" "05-analyses"
navigate_by_link "Clientes" "06-clients"
navigate_by_link "Financeiro" "07-finances"
navigate_by_link "Configurações" "08-settings"

log "Workflow complete. Screenshots and logs saved in: $OUTPUT_DIR"
