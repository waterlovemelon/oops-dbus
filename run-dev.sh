#!/bin/bash
# Run D-Bus Workbench Electron in development mode

cd "$(dirname "$0")"

echo "Starting D-Bus Workbench Electron..."
echo "Press Ctrl+C to stop"
echo ""

npm run dev
