#!/bin/bash

# Deployment script for neo-kinklist
# Usage: ./scripts/deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
BUILD_DIR="./build"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Validate build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
fi

# Validate required files exist
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ index.html not found in build directory."
    exit 1
fi

echo "✅ Build artifacts validated"

# Set target directory based on environment
if [ "$ENVIRONMENT" = "prod" ]; then
    TARGET_DIR="${SFTP_REMOTE_DIR_PROD:-/var/www/html/kinklist}"
    echo "📦 Deploying to production: $TARGET_DIR"
elif [ "$ENVIRONMENT" = "dev" ]; then
    TARGET_DIR="${SFTP_REMOTE_DIR_DEV:-/var/www/html/kinklist-dev}"
    echo "📦 Deploying to development: $TARGET_DIR"
else
    echo "❌ Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

echo "🎯 Target directory: $TARGET_DIR"
echo "📁 Source directory: $BUILD_DIR"

# Create a deployment manifest
echo "{
  \"deployment\": {
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"environment\": \"$ENVIRONMENT\",
    \"branch\": \"${GITHUB_REF_NAME:-$(git branch --show-current)}\",
    \"commit\": \"${GITHUB_SHA:-$(git rev-parse HEAD)}\",
    \"build_dir\": \"$BUILD_DIR\",
    \"target_dir\": \"$TARGET_DIR\"
  }
}" > "$BUILD_DIR/deployment-info.json"

echo "✅ Deployment manifest created"
echo "✅ Ready for SFTP deployment"
