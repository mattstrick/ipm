#!/bin/bash
# Test installing a package from the IPM registry via the IPM CLI.
# Uses array-first, which the registry resolves to https://github.com/mattstrick/array-first
# Prerequisites: IPM server running (npm run server), ipm CLI on PATH (e.g. brew).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$(mktemp -d -t ipm-test-XXXX)"
cd "$TEST_DIR"

# Use local IPM registry (resolves array-first -> mattstrick/array-first from repo-conversions)
export IPM_REGISTRY="${IPM_REGISTRY:-http://localhost:3001/registry}"

echo "Test dir: $TEST_DIR"
echo '{"name":"test","version":"1.0.0"}' > package.json

echo "Installing array-first from IPM registry (https://github.com/mattstrick/array-first)..."
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
