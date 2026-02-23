#!/bin/bash
# Test installing a package from the IPM registry via the IPM CLI.
# Prerequisites: IPM server running (npm run server), ipm CLI on PATH (e.g. brew).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$(mktemp -d -t ipm-test-XXXX)"
cd "$TEST_DIR"

echo "Test dir: $TEST_DIR"
echo '{"name":"test","version":"1.0.0"}' > package.json

echo "Installing array-first from IPM registry (default)..."
ipm install array-first

if [ -d node_modules/array-first ]; then
  echo "OK: node_modules/array-first exists"
  ls node_modules/array-first/package.json 2>/dev/null && echo "OK: package.json present"
else
  echo "FAIL: node_modules/array-first not found"
  exit 1
fi

echo "Cleaning up $TEST_DIR"
rm -rf "$TEST_DIR"
echo "Test passed."
