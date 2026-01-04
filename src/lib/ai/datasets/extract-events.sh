#!/bin/bash
# Bash script to extract ML match events from app.log
# Usage: ./extract-events.sh [log-file] [output-file]

LOG_FILE="${1:-app.log}"
OUTPUT_FILE="${2:-match_events.jsonl}"

echo "🔍 Extracting ML match events from $LOG_FILE..."

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Error: Log file '$LOG_FILE' not found!"
    exit 1
fi

# Extract events and clean up the format
grep "\[ML_MATCH_EVENT\]" "$LOG_FILE" | sed 's/.*\[ML_MATCH_EVENT\] //' > "$OUTPUT_FILE"

EVENT_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

if [ "$EVENT_COUNT" -eq 0 ]; then
    echo "⚠️  Warning: No ML match events found in $LOG_FILE"
    echo "   Make sure you performed match actions and the app is logging events."
    exit 1
fi

echo "✅ Extracted $EVENT_COUNT events to $OUTPUT_FILE"

# Show statistics
echo ""
echo "📊 Event Statistics:"
echo "   Total events: $EVENT_COUNT"

USER_USER_COUNT=$(grep -c '"matchType":"user_user"' "$OUTPUT_FILE" || echo "0")
USER_GROUP_COUNT=$(grep -c '"matchType":"user_group"' "$OUTPUT_FILE" || echo "0")
echo "   User-User matches: $USER_USER_COUNT"
echo "   User-Group matches: $USER_GROUP_COUNT"

ACCEPT_COUNT=$(grep -c '"outcome":"accept"' "$OUTPUT_FILE" || echo "0")
CHAT_COUNT=$(grep -c '"outcome":"chat"' "$OUTPUT_FILE" || echo "0")
IGNORE_COUNT=$(grep -c '"outcome":"ignore"' "$OUTPUT_FILE" || echo "0")
UNMATCH_COUNT=$(grep -c '"outcome":"unmatch"' "$OUTPUT_FILE" || echo "0")

echo ""
echo "📈 Outcome Distribution:"
echo "   Accept: $ACCEPT_COUNT"
echo "   Chat: $CHAT_COUNT"
echo "   Ignore: $IGNORE_COUNT"
echo "   Unmatch: $UNMATCH_COUNT"

echo ""
echo "✅ Extraction complete! Next step:"
echo "   python src/lib/ai/datasets/build_training_set.py $OUTPUT_FILE"

