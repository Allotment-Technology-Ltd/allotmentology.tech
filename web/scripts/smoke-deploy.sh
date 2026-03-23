#!/usr/bin/env bash
# Post-deploy smoke: health + optional auth routes (set COOKIE if you need a session).
set -euo pipefail
BASE="${SMOKE_BASE_URL:-http://127.0.0.1:3000}"
echo "Smoke: GET ${BASE}/api/health"
code="$(curl -sS -o /tmp/allotment-smoke-health.json -w "%{http_code}" "${BASE}/api/health")"
if [[ "$code" != "200" ]]; then
  echo "FAIL: health HTTP $code" >&2
  exit 1
fi
if ! grep -q '"ok":true' /tmp/allotment-smoke-health.json; then
  echo "FAIL: health body missing ok:true" >&2
  cat /tmp/allotment-smoke-health.json >&2
  exit 1
fi
echo "OK: database reachable via /api/health"
echo "Next: open ${BASE}/auth/sign-in in a browser, then hit /settings/restormel-keys and /submission-packs"
