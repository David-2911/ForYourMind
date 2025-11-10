#!/bin/bash
# ====================================
# Docker Build and Deploy Script
# ====================================
# Builds Docker images for production deployment

set -e

echo "======================================"
echo "🐳 Docker Build Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}ℹ${NC} $1"; }
print_step() { echo -e "${BLUE}▶${NC} $1"; }

# Parse arguments
BUILD_BACKEND=true
BUILD_FRONTEND=true
PUSH_IMAGES=false
TAG="latest"

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            BUILD_FRONTEND=false
            shift
            ;;
        --frontend-only)
            BUILD_BACKEND=false
            shift
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--backend-only] [--frontend-only] [--push] [--tag <tag>]"
            exit 1
            ;;
    esac
done

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi
print_success "Docker is running"
echo ""

# Set image names (update with your registry)
BACKEND_IMAGE="mindfulme-backend:${TAG}"
FRONTEND_IMAGE="mindfulme-frontend:${TAG}"

# Build backend
if [ "$BUILD_BACKEND" = true ]; then
    print_step "Building backend image: ${BACKEND_IMAGE}"
    docker build \
        --file backend/Dockerfile \
        --tag "${BACKEND_IMAGE}" \
        --target production \
        .
    
    if [ $? -eq 0 ]; then
        print_success "Backend image built"
        # Show image size
        SIZE=$(docker images "${BACKEND_IMAGE}" --format "{{.Size}}")
        echo "   Size: ${SIZE}"
    else
        print_error "Failed to build backend image"
        exit 1
    fi
    echo ""
fi

# Build frontend
if [ "$BUILD_FRONTEND" = true ]; then
    print_step "Building frontend image: ${FRONTEND_IMAGE}"
    
    # Get API URL from environment or use default
    API_URL="${VITE_API_URL:-https://api.mindfulme.com}"
    
    docker build \
        --file frontend/Dockerfile \
        --tag "${FRONTEND_IMAGE}" \
        --target production \
        --build-arg VITE_API_URL="${API_URL}" \
        --build-arg VITE_NODE_ENV=production \
        --build-arg VITE_APP_VERSION="${TAG}" \
        .
    
    if [ $? -eq 0 ]; then
        print_success "Frontend image built"
        SIZE=$(docker images "${FRONTEND_IMAGE}" --format "{{.Size}}")
        echo "   Size: ${SIZE}"
    else
        print_error "Failed to build frontend image"
        exit 1
    fi
    echo ""
fi

# Push images (if requested)
if [ "$PUSH_IMAGES" = true ]; then
    print_step "Pushing images to registry..."
    
    if [ "$BUILD_BACKEND" = true ]; then
        print_info "Pushing ${BACKEND_IMAGE}..."
        docker push "${BACKEND_IMAGE}"
        print_success "Backend image pushed"
    fi
    
    if [ "$BUILD_FRONTEND" = true ]; then
        print_info "Pushing ${FRONTEND_IMAGE}..."
        docker push "${FRONTEND_IMAGE}"
        print_success "Frontend image pushed"
    fi
    echo ""
fi

# Summary
echo "======================================"
echo -e "${GREEN}✅ Docker Build Complete!${NC}"
echo "======================================"
echo ""
echo "📦 Images Built:"
if [ "$BUILD_BACKEND" = true ]; then
    echo "   - Backend: ${BACKEND_IMAGE}"
fi
if [ "$BUILD_FRONTEND" = true ]; then
    echo "   - Frontend: ${FRONTEND_IMAGE}"
fi
echo ""
echo "🚀 Next Steps:"
echo "   1. Test locally:"
echo "      docker-compose -f docker-compose.prod.yml up"
echo ""
echo "   2. Push to registry:"
echo "      $0 --push --tag v1.0.0"
echo ""
echo "   3. Deploy to production:"
echo "      docker-compose -f docker-compose.prod.yml up -d"
echo ""
