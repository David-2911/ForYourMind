#!/bin/bash
set -e

echo "=== MindfulMe Frontend Build Script ==="

# Clean installation
echo "📦 Installing dependencies..."
npm ci || npm install

# Install Vite explicitly
echo "🔧 Installing build tools..."
npm install vite --no-save

# Build frontend only
echo "🏗️ Building frontend..."
./node_modules/.bin/vite build

# Create a simple static file server
echo "📄 Creating static file server..."
cat > serve-static.js << 'EOF'
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// For any other request, send index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
EOF

echo "✅ Frontend build completed successfully!"
