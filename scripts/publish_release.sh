#!/usr/bin/env bash
set -e

echo "========================================================"
echo "🚀 SK MISSION BOARD - Codemagic Post-Build Release Engine"
echo "========================================================"

# Make sure we are at project root
PROJECT_ROOT="$(pwd)"
echo "Current directory: $PROJECT_ROOT"

# Run Node.js release inspector and manifest publisher
if command -v npx >/dev/null 2>&1; then
  echo "Running release inspector with npx tsx..."
  npx tsx "$PROJECT_ROOT/scripts/inspect_and_publish_apk.ts"
else
  echo "Running release inspector with node..."
  node -r ts-node/register "$PROJECT_ROOT/scripts/inspect_and_publish_apk.ts" || npx tsx "$PROJECT_ROOT/scripts/inspect_and_publish_apk.ts"
fi

echo "========================================================"
echo "✨ Codemagic Release Update Step Completed Successfully"
echo "========================================================"
