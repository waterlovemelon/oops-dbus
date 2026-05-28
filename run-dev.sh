#!/bin/bash
# Run Oops DBus in development mode

cd "$(dirname "$0")"

echo "Starting Oops DBus..."
echo "Press Ctrl+C to stop"
echo ""

npm run dev
