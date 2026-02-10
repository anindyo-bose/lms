#!/bin/bash
# Check Lighthouse score for mobile (minimum 90)

LIGHTHOUSE_JSON="lighthouse-report.json"

if [ ! -f "$LIGHTHOUSE_JSON" ]; then
  echo "🏛️  Running Lighthouse audit for shell app..."
  cd apps/shell
  pnpm run lighthouse || true
  cd ../..
fi

if [ ! -f "$LIGHTHOUSE_JSON" ]; then
  echo "❌ Lighthouse report not generated"
  exit 1
fi

# Extract scores
PERFORMANCE=$(grep '"performance"' "$LIGHTHOUSE_JSON" | head -1 | grep -o '[0-9]*' | head -1)
ACCESSIBILITY=$(grep '"accessibility"' "$LIGHTHOUSE_JSON" | head -1 | grep -o '[0-9]*' | head -1)
BEST_PRACTICES=$(grep '"best-practices"' "$LIGHTHOUSE_JSON" | head -1 | grep -o '[0-9]*' | head -1)
SEO=$(grep '"seo"' "$LIGHTHOUSE_JSON" | head -1 | grep -o '[0-9]*' | head -1)

THRESHOLD=90
FAILED=false

echo "🏛️  Lighthouse Scores (Mobile)"
echo "=============================="
echo "Performance:   ${PERFORMANCE:-N/A}/100 (threshold: ${THRESHOLD})"
echo "Accessibility: ${ACCESSIBILITY:-N/A}/100 (threshold: ${THRESHOLD})"
echo "Best Practices:${BEST_PRACTICES:-N/A}/100 (threshold: ${THRESHOLD})"
echo "SEO:           ${SEO:-N/A}/100"
echo ""

if [ -n "$PERFORMANCE" ] && [ "$PERFORMANCE" -lt "$THRESHOLD" ]; then
  echo "❌ Performance score below threshold"
  FAILED=true
fi

if [ -n "$ACCESSIBILITY" ] && [ "$ACCESSIBILITY" -lt "$THRESHOLD" ]; then
  echo "❌ Accessibility score below threshold"
  FAILED=true
fi

if [ -n "$BEST_PRACTICES" ] && [ "$BEST_PRACTICES" -lt "$THRESHOLD" ]; then
  echo "❌ Best Practices score below threshold"
  FAILED=true
fi

if [ "$FAILED" = true ]; then
  echo ""
  echo "❌ Lighthouse check FAILED"
  exit 1
else
  echo "✅ Lighthouse scores meet requirements!"
  exit 0
fi
