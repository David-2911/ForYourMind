#!/bin/bash

# Build only the frontend (Vite/React)
echo "Building frontend for Render deployment..."
vite build

# Create a simple serve script for the frontend
echo "Creating serve script for the frontend..."
cat > serve-frontend.js << 'EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// For any other request, send the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
EOF

echo "Frontend build completed successfully!"
