#!/usr/bin/env bash
# Anime Hub - start the local hub on this machine.
#
#   ./run.sh                 local only   -> http://127.0.0.1:8787
#   ./run.sh --host lan      also reachable from a phone on the same network
#   ./run.sh --config FILE   use a specific config file
#
# Everything is served by hub.py from this folder; there is nothing to build.
set -euo pipefail
cd "$(dirname "$0")"
PY="${PYTHON:-python3}"
if ! command -v "$PY" >/dev/null 2>&1; then
  echo "run.sh: python3 not found. Install Python 3.9 or newer and try again." >&2
  exit 1
fi
exec "$PY" hub.py "$@"
