#!/bin/bash
# Post-build script to copy static files and public assets to standalone directory
# Required for Next.js standalone mode to serve static files correctly

set -e

echo "Copying static files to standalone directory..."

# Copy .next/static to standalone/.next/static
if [ -d ".next/static" ]; then
  echo "Copying .next/static..."
  mkdir -p .next/standalone/apps/web/.next
  cp -r .next/static .next/standalone/apps/web/.next/static
  echo "✓ Static files copied"
else
  echo "⚠ Warning: .next/static directory not found"
fi

# Copy public to standalone/public
if [ -d "public" ]; then
  echo "Copying public assets..."
  mkdir -p .next/standalone/apps/web
  cp -r public .next/standalone/apps/web/public
  echo "✓ Public files copied"
else
  echo "⚠ Warning: public directory not found"
fi

echo "✓ Post-build completed successfully"
