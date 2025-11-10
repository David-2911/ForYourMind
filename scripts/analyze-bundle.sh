#!/bin/bash

# Bundle Analysis Script
# Analyzes frontend and backend bundle sizes

set -e

echo "🔍 Analyzing Bundle Sizes..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backend Analysis
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Backend Bundle Analysis${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "backend/dist/index.js" ]; then
    BACKEND_SIZE=$(du -h backend/dist/index.js | cut -f1)
    BACKEND_BYTES=$(stat -f%z backend/dist/index.js 2>/dev/null || stat -c%s backend/dist/index.js 2>/dev/null)
    echo -e "📦 Bundle Size: ${GREEN}$BACKEND_SIZE${NC} ($BACKEND_BYTES bytes)"
    
    if [ -f "backend/dist/index.js.map" ]; then
        MAP_SIZE=$(du -h backend/dist/index.js.map | cut -f1)
        echo -e "🗺️  Source Map: $MAP_SIZE"
    fi
    
    echo ""
    echo "📊 Dependencies (external):"
    grep -o "packages=external" backend/package.json >/dev/null 2>&1 && echo "  ✓ All dependencies external (not bundled)"
    
else
    echo -e "${YELLOW}⚠️  Backend not built yet. Run: npm run build:backend${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Frontend Bundle Analysis${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d "frontend/dist" ]; then
    # Total size
    TOTAL_SIZE=$(du -sh frontend/dist | cut -f1)
    echo -e "📦 Total Build Size: ${GREEN}$TOTAL_SIZE${NC}"
    echo ""
    
    # Individual chunks
    echo "📊 JavaScript Chunks:"
    if [ -d "frontend/dist/assets/js" ]; then
        for file in frontend/dist/assets/js/*.js; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                size=$(du -h "$file" | cut -f1)
                
                # Get gzip size if available
                if command -v gzip >/dev/null 2>&1; then
                    gzip_size=$(gzip -c "$file" | wc -c | awk '{print $1}')
                    gzip_kb=$(echo "scale=2; $gzip_size / 1024" | bc)
                    echo -e "  ${GREEN}✓${NC} $filename: $size (${gzip_kb}KB gzipped)"
                else
                    echo -e "  ${GREEN}✓${NC} $filename: $size"
                fi
            fi
        done
    else
        # Fallback if js directory doesn't exist
        for file in frontend/dist/assets/*.js; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                size=$(du -h "$file" | cut -f1)
                echo -e "  ${GREEN}✓${NC} $filename: $size"
            fi
        done
    fi
    
    echo ""
    echo "🎨 CSS Files:"
    for file in frontend/dist/assets/*.css; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            size=$(du -h "$file" | cut -f1)
            
            if command -v gzip >/dev/null 2>&1; then
                gzip_size=$(gzip -c "$file" | wc -c | awk '{print $1}')
                gzip_kb=$(echo "scale=2; $gzip_size / 1024" | bc)
                echo -e "  ${GREEN}✓${NC} $filename: $size (${gzip_kb}KB gzipped)"
            else
                echo -e "  ${GREEN}✓${NC} $filename: $size"
            fi
        fi
    done
    
    echo ""
    echo "🖼️  Assets:"
    if [ -d "frontend/dist/assets/images" ]; then
        IMAGE_SIZE=$(du -sh frontend/dist/assets/images 2>/dev/null | cut -f1 || echo "0K")
        echo -e "  Images: $IMAGE_SIZE"
    fi
    if [ -d "frontend/dist/assets/fonts" ]; then
        FONT_SIZE=$(du -sh frontend/dist/assets/fonts 2>/dev/null | cut -f1 || echo "0K")
        echo -e "  Fonts: $FONT_SIZE"
    fi
    
    echo ""
    echo "📈 Optimization Summary:"
    
    # Calculate total JS size
    TOTAL_JS=0
    for file in frontend/dist/assets/js/*.js frontend/dist/assets/*.js; do
        if [ -f "$file" ]; then
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            TOTAL_JS=$((TOTAL_JS + size))
        fi
    done
    
    # Calculate total gzipped size (approximate)
    TOTAL_GZIPPED=0
    for file in frontend/dist/assets/js/*.js frontend/dist/assets/*.js; do
        if [ -f "$file" ] && command -v gzip >/dev/null 2>&1; then
            size=$(gzip -c "$file" | wc -c | awk '{print $1}')
            TOTAL_GZIPPED=$((TOTAL_GZIPPED + size))
        fi
    done
    
    JS_KB=$(echo "scale=2; $TOTAL_JS / 1024" | bc)
    GZIP_KB=$(echo "scale=2; $TOTAL_GZIPPED / 1024" | bc)
    
    if [ "$TOTAL_GZIPPED" -gt 0 ]; then
        COMPRESSION=$(echo "scale=1; 100 - ($TOTAL_GZIPPED * 100 / $TOTAL_JS)" | bc)
        echo -e "  Total JS: ${JS_KB}KB raw → ${GZIP_KB}KB gzipped (${GREEN}${COMPRESSION}% compression${NC})"
    else
        echo -e "  Total JS: ${JS_KB}KB"
    fi
    
    # Recommendations
    echo ""
    echo "💡 Recommendations:"
    if [ "$TOTAL_JS" -gt 512000 ]; then
        echo -e "  ${YELLOW}⚠️  Large bundle size. Consider:${NC}"
        echo "     - Code splitting for routes"
        echo "     - Lazy loading components"
        echo "     - Tree shaking unused code"
    else
        echo -e "  ${GREEN}✓${NC} Bundle size is optimal!"
    fi
    
    # Check for source maps in production
    if ls frontend/dist/assets/*.js.map >/dev/null 2>&1; then
        echo -e "  ${YELLOW}⚠️  Source maps in production build (consider removing)${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  Frontend not built yet. Run: npm run build:frontend${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Shared Package Analysis${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d "shared/dist" ]; then
    SHARED_SIZE=$(du -sh shared/dist | cut -f1)
    echo -e "📦 Shared Package Size: ${GREEN}$SHARED_SIZE${NC}"
    echo ""
    
    echo "📄 Files:"
    find shared/dist -type f -name "*.js" -o -name "*.d.ts" | while read file; do
        filename=$(basename "$file")
        size=$(du -h "$file" | cut -f1)
        echo -e "  ${GREEN}✓${NC} $filename: $size"
    done
else
    echo -e "${YELLOW}⚠️  Shared package not built yet. Run: npm run build:shared${NC}"
fi

echo ""
echo "✅ Analysis complete!"
