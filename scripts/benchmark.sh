#!/bin/bash

# Performance Benchmarking Script
# Tests backend startup time and API response times

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
ITERATIONS="${ITERATIONS:-5}"

echo "🚀 Performance Benchmarking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend is running
check_backend() {
    if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend not running at $BACKEND_URL${NC}"
        echo "   Start backend with: cd backend && npm run dev"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Backend is running"
}

# Measure backend startup time
benchmark_startup() {
    echo ""
    echo -e "${BLUE}📊 Backend Startup Time${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "Measuring startup time (requires backend restart)..."
    echo "Press Enter to continue or Ctrl+C to skip"
    read -r
    
    # Kill existing backend
    pkill -f "node.*backend" || true
    sleep 1
    
    # Start backend and measure time
    START=$(date +%s%N)
    cd backend && npm run dev > /tmp/backend-startup.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    MAX_WAIT=30
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
            END=$(date +%s%N)
            DURATION=$(echo "scale=3; ($END - $START) / 1000000000" | bc)
            echo -e "${GREEN}✓${NC} Backend started in ${GREEN}${DURATION}s${NC}"
            
            # Categorize performance
            if (( $(echo "$DURATION < 2" | bc -l) )); then
                echo -e "   Performance: ${GREEN}Excellent${NC}"
            elif (( $(echo "$DURATION < 5" | bc -l) )); then
                echo -e "   Performance: ${YELLOW}Good${NC}"
            else
                echo -e "   Performance: ${RED}Slow${NC} (consider optimization)"
            fi
            
            cd ..
            return 0
        fi
        sleep 0.5
        WAITED=$((WAITED + 1))
    done
    
    echo -e "${RED}❌ Backend failed to start within ${MAX_WAIT}s${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    cd ..
    exit 1
}

# Benchmark API endpoint
benchmark_endpoint() {
    local endpoint=$1
    local name=$2
    local method=${3:-GET}
    local data=$4
    
    echo ""
    echo "Testing: $name"
    echo "Endpoint: $method $endpoint"
    echo "Iterations: $ITERATIONS"
    echo ""
    
    local total=0
    local min=999999
    local max=0
    
    for i in $(seq 1 $ITERATIONS); do
        if [ "$method" = "POST" ] && [ -n "$data" ]; then
            response=$(curl -s -w "\n%{time_total}" -X POST \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BACKEND_URL$endpoint")
        else
            response=$(curl -s -w "\n%{time_total}" "$BACKEND_URL$endpoint")
        fi
        
        time=$(echo "$response" | tail -1)
        time_ms=$(echo "$time * 1000" | bc)
        
        total=$(echo "$total + $time_ms" | bc)
        
        # Track min/max
        if (( $(echo "$time_ms < $min" | bc -l) )); then
            min=$time_ms
        fi
        if (( $(echo "$time_ms > $max" | bc -l) )); then
            max=$time_ms
        fi
        
        echo -n "."
    done
    
    echo ""
    
    avg=$(echo "scale=2; $total / $ITERATIONS" | bc)
    
    echo -e "  Average: ${GREEN}${avg}ms${NC}"
    echo -e "  Min: ${min}ms"
    echo -e "  Max: ${max}ms"
    
    # Performance rating
    if (( $(echo "$avg < 50" | bc -l) )); then
        echo -e "  Rating: ${GREEN}Excellent${NC} 🚀"
    elif (( $(echo "$avg < 200" | bc -l) )); then
        echo -e "  Rating: ${GREEN}Good${NC} ✓"
    elif (( $(echo "$avg < 500" | bc -l) )); then
        echo -e "  Rating: ${YELLOW}Acceptable${NC} ⚠️"
    else
        echo -e "  Rating: ${RED}Slow${NC} ❌ (needs optimization)"
    fi
}

# Main benchmarking
main() {
    echo "Checking backend availability..."
    check_backend
    
    # Uncomment to test startup time (requires backend restart)
    # benchmark_startup
    
    echo ""
    echo -e "${BLUE}📊 API Response Time Benchmarks${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Health endpoints
    benchmark_endpoint "/health" "Health Check (Detailed)"
    benchmark_endpoint "/healthz" "Health Check (Simple)"
    benchmark_endpoint "/ready" "Readiness Check"
    
    # Note: Authenticated endpoints require valid tokens
    echo ""
    echo -e "${YELLOW}ℹ️  Authenticated endpoints require valid tokens${NC}"
    echo "   To test authenticated endpoints, add token parameter to benchmark_endpoint calls"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ Benchmarking complete!${NC}"
    echo ""
    echo "💡 Tips for optimization:"
    echo "  - Use caching for frequently accessed data"
    echo "  - Add database indexes for common queries"
    echo "  - Enable compression for API responses"
    echo "  - Consider Redis for session storage"
    echo "  - Use CDN for static assets"
}

main
