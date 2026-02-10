#!/bin/bash
# Check test coverage against 95% threshold

COVERAGE_FILE="coverage/coverage-summary.json"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "❌ Coverage summary not found. Run: pnpm run test:coverage"
  exit 1
fi

# Extract coverage percentages
STATEMENTS=$(grep '"statements"' "$COVERAGE_FILE" | grep -o '"pct": [0-9.]*' | grep -o '[0-9.]*')
BRANCHES=$(grep '"branches"' "$COVERAGE_FILE" | grep -o '"pct": [0-9.]*' | grep -o '[0-9.]*')
FUNCTIONS=$(grep '"functions"' "$COVERAGE_FILE" | grep -o '"pct": [0-9.]*' | grep -o '[0-9.]*')
LINES=$(grep '"lines"' "$COVERAGE_FILE" | grep -o '"pct": [0-9.]*' | grep -o '[0-9.]*')

THRESHOLD=95
FAILED=false

echo "📊 Coverage Report"
echo "==================="
echo "Statements: ${STATEMENTS}% (threshold: ${THRESHOLD}%)"
echo "Branches:   ${BRANCHES}% (threshold: ${THRESHOLD}%)"
echo "Functions:  ${FUNCTIONS}% (threshold: ${THRESHOLD}%)"
echo "Lines:      ${LINES}% (threshold: ${THRESHOLD}%)"
echo ""

if (( $(echo "$STATEMENTS < $THRESHOLD" | bc -l) )); then
  echo "❌ Statements coverage below threshold"
  FAILED=true
fi

if (( $(echo "$BRANCHES < $THRESHOLD" | bc -l) )); then
  echo "❌ Branches coverage below threshold"
  FAILED=true
fi

if (( $(echo "$FUNCTIONS < $THRESHOLD" | bc -l) )); then
  echo "❌ Functions coverage below threshold"
  FAILED=true
fi

if (( $(echo "$LINES < $THRESHOLD" | bc -l) )); then
  echo "❌ Lines coverage below threshold"
  FAILED=true
fi

if [ "$FAILED" = true ]; then
  echo ""
  echo "❌ Coverage check FAILED"
  exit 1
else
  echo "✅ All coverage thresholds met!"
  exit 0
fi
