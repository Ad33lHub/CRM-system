#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Newman test runner for CRM API tests
# Usage: ./run-tests.sh [local|staging]
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV="${1:-local}"
COLLECTION="$SCRIPT_DIR/CRM_API_Tests.postman_collection.json"
REPORT_DIR="$SCRIPT_DIR/../../tests/reports"

mkdir -p "$REPORT_DIR"

if [ "$ENV" = "staging" ]; then
  ENV_FILE="$SCRIPT_DIR/envs/CRM_Staging.postman_environment.json"
else
  ENV_FILE="$SCRIPT_DIR/envs/CRM_Local.postman_environment.json"
fi

echo "═══════════════════════════════════════════════════════════"
echo "  CRM API Tests — Environment: $ENV"
echo "═══════════════════════════════════════════════════════════"

newman run "$COLLECTION" \
  --environment "$ENV_FILE" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export "$REPORT_DIR/api-test-report.html" \
  --timeout-request 10000 \
  --bail

echo ""
echo "✅ All tests passed!"
echo "📄 HTML report: $REPORT_DIR/api-test-report.html"
