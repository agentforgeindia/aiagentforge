#!/bin/bash
# Starts the local staging stack: PostgREST, the stand-in for Supabase
# auth / Razorpay / n8n (gateway.cjs) and the built app.
#   ./stack.sh env     print the environment the app must be BUILT and run with
#   ./stack.sh up      start everything (run `next build` with that env first)
#   ./stack.sh down    stop everything
# All "keys" below are made-up local values. Never put a real key here.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
export AF_STAGING_WORK="${AF_STAGING_WORK:-$REPO/.staging-work}"; mkdir -p "$AF_STAGING_WORK"; W="$AF_STAGING_WORK"
PGRST_BIN="${POSTGREST_BIN:-$W/postgrest}"
envfile() { cat > "$W/staging.env" <<ENV
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54400
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(node "$HERE/jwt.cjs" anon)
export SUPABASE_SERVICE_ROLE_KEY=$(node "$HERE/jwt.cjs" service_role)
export RAZORPAY_KEY_ID=rzp_test_localstaging
export RAZORPAY_KEY_SECRET=local-staging-razorpay-secret
export RAZORPAY_WEBHOOK_SECRET=local-staging-webhook-secret
export N8N_WEBHOOK_SECRET=local-staging-n8n-secret
export N8N_TEXTILE_WEBHOOK_URL=http://127.0.0.1:54400/n8n/textile
export N8N_JEWELLERY_WEBHOOK_URL=http://127.0.0.1:54400/n8n/jewellery
export N8N_PRODUCTOGRAPHY_WEBHOOK_URL=http://127.0.0.1:54400/n8n/productography
export CRON_SECRET=local-staging-cron-secret
export GENERATION_STALE_MINUTES=10
export NEXT_TELEMETRY_DISABLED=1
ENV
}
# "next start" hands over to a child process called "next-server", so the pid
# of the command we started is not the pid that holds the port. Find the real
# one by name + working directory, otherwise an old build keeps answering.
app_pids() { for d in /proc/[0-9]*; do
    case "$( { tr '\0' ' ' < "$d/cmdline"; } 2>/dev/null )" in next-server*|*next/dist/bin/next\ start*) [ "$(readlink "$d/cwd" 2>/dev/null)" = "$REPO" ] && echo "${d#/proc/}" ;; esac
  done; }
stop() {
  for f in pgrst gw app; do [ -f "$W/$f.pid" ] && kill "$(cat "$W/$f.pid")" 2>/dev/null || true; rm -f "$W/$f.pid"; done
  for pid in $(app_pids); do kill "$pid" 2>/dev/null || true; done
  for i in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null --max-time 1 http://127.0.0.1:54402/ || return 0; sleep 1; done
  echo "the old app server on :54402 did not stop"; exit 1
}
case "${1:-}" in
  env) envfile; cat "$W/staging.env" ;;
  down) stop ;;
  up)
    [ -x "$PGRST_BIN" ] || { echo "PostgREST binary not found at $PGRST_BIN (see README.md)"; exit 1; }
    stop; envfile; . "$W/staging.env"
    cat > "$W/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:local-only@${PGHOST:-127.0.0.1}:${PGPORT:-54329}/afstaging"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "local-staging-jwt-secret-not-a-real-key-0123456789"
server-host = "127.0.0.1"
server-port = 54401
CONF
    nohup "$PGRST_BIN" "$W/postgrest.conf" > "$W/postgrest.log" 2>&1 & echo $! > "$W/pgrst.pid"
    nohup node "$HERE/gateway.cjs" > "$W/gateway.log" 2>&1 & echo $! > "$W/gw.pid"
    ( cd "$REPO" && NODE_OPTIONS="--require $HERE/preload.cjs" nohup node node_modules/next/dist/bin/next start -p 54402 -H 127.0.0.1 > "$W/app.log" 2>&1 & echo $! > "$W/app.pid" )
    for i in $(seq 1 30); do curl -s -o /dev/null --max-time 1 http://127.0.0.1:54402/api/cron/generation-sweeper && break; sleep 1; done
    grep -q "EADDRINUSE" "$W/app.log" && { echo "port 54402 was still taken — the app did not start"; exit 1; }
    # the server must be serving THIS build
    BUILD="$(cat "$REPO/.next/BUILD_ID")"
    curl -s http://127.0.0.1:54402/pricing | grep -q "$BUILD" || { echo "the app on :54402 is not serving build $BUILD"; exit 1; }
    echo "postgrest :54401  gateway :54400  app :54402 (build $BUILD)  logs in $W" ;;
  *) echo "usage: $0 env|up|down"; exit 1 ;;
esac
