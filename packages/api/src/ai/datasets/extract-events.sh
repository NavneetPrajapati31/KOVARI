#!/bin/bash
# Bash script to extract ML match events from app.log
# Usage: ./extract-events.sh [log-file] [output-file]

LOG_FILE=${1:-app.log}
OUTPUT_FILE=${2:-match_events.jsonl}

if [ ! -f "$LOG_FILE" ]; then
    echo -e "\033[31m❌ Error: Log file '$LOG_FILE' not found!\033[0m"
    exit 1
fi

echo -e "\033[36m🔍 Extracting ML match events from $LOG_FILE...\033[0m"

# Extract events and clean up the format
grep "\[ML_MATCH_EVENT\]" "$LOG_FILE" | sed 's/.*\[ML_MATCH_EVENT\]//' | grep -v "^$" > "$OUTPUT_FILE"

EVENT_COUNT=$(wc -l < "$OUTPUT_FILE")

if [ "$EVENT_COUNT" -eq 0 ]; then
    echo -e "\033[33m⚠️  Warning: No ML match events found in $LOG_FILE\033[0m"
    echo -e "\033[33m   Make sure you performed match actions and the app is logging events.\033[0m"
    exit 1
fi

echo -e "\033[32m✅ Extracted $EVENT_COUNT events to $OUTPUT_FILE\033[0m"

# Show statistics
echo -e "\n\033[36m📊 Event Statistics:\033[0m"
echo "   Total events: $EVENT_COUNT"

USER_USER_COUNT=$(grep -c '"matchType":"user_user"' "$OUTPUT_FILE")
USER_GROUP_COUNT=$(grep -c '"matchType":"user_group"' "$OUTPUT_FILE")
echo "   User-User matches: $USER_USER_COUNT"
echo "   User-Group matches: $USER_GROUP_COUNT"

ACCEPT_COUNT=$(grep -c '"outcome":"accept"' "$OUTPUT_FILE")
CHAT_COUNT=$(grep -c '"outcome":"chat"' "$OUTPUT_FILE")
IGNORE_COUNT=$(grep -c '"outcome":"ignore"' "$OUTPUT_FILE")
UNMATCH_COUNT=$(grep -c '"outcome":"unmatch"' "$OUTPUT_FILE")

echo -e "\n\033[36m📈 Outcome Distribution:\033[0m"
echo "   Accept: $ACCEPT_COUNT"
echo "   Chat: $CHAT_COUNT"
echo "   Ignore: $IGNORE_COUNT"
echo "   Unmatch: $UNMATCH_COUNT"

echo -e "\n\033[32m✅ Extraction complete! Next step:\033[0m"
echo -e "\033[33m   python packages/api/src/ai/datasets/build_training_set.py $OUTPUT_FILE\033[0m"
