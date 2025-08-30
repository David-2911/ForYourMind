#!/bin/bash
set -e

echo "=== MindfulMe Complete Build Script ==="

echo "📦 Installing ALL dependencies (including dev dependencies)..."
npm install --include=dev

echo "🏗️ Building frontend..."
npx vite build

echo "🏗️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "🔧 Creating ESM-compatible path helper..."
cat > dist/path-helper.js << 'EOF'
import { fileURLToPath } from 'url';
import path from 'path';

// Helper function to get __dirname equivalent in ESM
export function getDirname(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  return path.dirname(__filename);
}
EOF

echo "🔧 Updating index.js to use path-helper..."
# Find and replace __dirname references with getDirname(import.meta.url)
sed -i 's/__dirname/getDirname(import.meta.url)/g' dist/index.js
# Add import for path-helper at the top of index.js
sed -i '1s/^/import { getDirname } from ".\/path-helper.js";\n/' dist/index.js

echo "✅ Build completed successfully!"