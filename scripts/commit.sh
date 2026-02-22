#!/usr/bin/env bash
# Usage: ./scripts/commit.sh "your commit message"
# Runs: git add . && git commit -m "your commit message"

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <message>"
  echo "  Runs: git add . && git commit -m \"<message>\""
  exit 1
fi

message="$*"
git add .
git commit -m "$message"
