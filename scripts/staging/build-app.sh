#!/bin/bash
# Builds the app for the local staging stack.
# The sandbox has no access to Google Fonts, so the two font imports in
# app/layout.tsx are stubbed for the build and the file is put back from a
# copy afterwards (never with "git checkout" — that would also throw away
# real, uncommitted edits to the file).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../.." && pwd)"
export AF_STAGING_WORK="${AF_STAGING_WORK:-$REPO/.staging-work}"; W="$AF_STAGING_WORK"
"$HERE/stack.sh" env > /dev/null; . "$W/staging.env"
cd "$REPO"
cp app/layout.tsx "$W/layout.tsx.orig"
restore() { cp "$W/layout.tsx.orig" "$REPO/app/layout.tsx"; }
trap restore EXIT
if [ "${AF_STUB_FONTS:-1}" = "1" ]; then
  sed -i 's|^import { Geist, Geist_Mono } from "next/font/google";|const Geist = (_o: unknown) => ({ variable: "" }); const Geist_Mono = (_o: unknown) => ({ variable: "" });|' app/layout.tsx
fi
node node_modules/next/dist/bin/next build > "$W/build.log" 2>&1 && echo "build ok (log: $W/build.log)" || { echo "build FAILED — see $W/build.log"; tail -20 "$W/build.log"; exit 1; }
