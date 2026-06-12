#!/bin/sh
set -e

MARKER_FILE="/home/node/.n8n/.workflows-imported"

n8n start &
N8N_PID=$!

echo "Waiting for n8n to start..."
for i in $(seq 1 30); do
  if wget --no-verbose --tries=1 --spider http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "n8n is ready!"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "n8n failed to start in time"
    exit 1
  fi
  sleep 2
done

if [ ! -f "$MARKER_FILE" ]; then
  echo "Importing workflows..."
  for f in /opt/n8n/workflows/*.json; do
    if [ -f "$f" ]; then
      name=$(basename "$f" .json)
      echo "  Importing: $name"
      n8n import:workflow --input="$f" 2>&1 || echo "  Import skipped/failed for $name"
    fi
  done
  # Give n8n a moment to process the import
  sleep 3
  # Activate all workflows that were just imported
  echo "Activating workflows..."
  n8n list:workflow 2>/dev/null | while read -r line; do
    wf_id=$(echo "$line" | cut -d'|' -f1)
    wf_name=$(echo "$line" | cut -d'|' -f2)
    if [ -n "$wf_id" ] && [ "$wf_id" != "ID" ]; then
      echo "  Publishing workflow: $wf_name (ID: $wf_id)"
      n8n publish:workflow --id="$wf_id" 2>&1 || true
    fi
  done
  date > "$MARKER_FILE"
  echo "Workflow import complete."
else
  echo "Workflows already imported (marker found)."
fi

echo "n8n setup complete."
wait $N8N_PID
