#!/bin/bash
# ==============================================================================
# Deploy Script for WEPAC Website
# ==============================================================================
# Usage: ./deploy/deploy.sh
# ==============================================================================

set -e

SERVER="deploy@77.42.82.10"
APP_DIR="/var/www/wepac"
DOMAIN="wepac.pt"

echo "=== Building WEPAC website ==="
NEXT_PUBLIC_STRIP_MOCK=true npm run build

echo ""
echo "=== Preparing deploy package ==="
# Create a clean deploy directory
rm -rf .deploy
mkdir -p .deploy

# Copy standalone build
cp -r .next/standalone/* .deploy/
cp -r .next/standalone/.next .deploy/ 2>/dev/null || true

# Copy static assets (not included in standalone)
mkdir -p .deploy/.next/static
cp -r .next/static/* .deploy/.next/static/

# Copy public assets
cp -r public .deploy/public

# Copy Prisma migration files (schema + migrations)
cp -r prisma .deploy/prisma

echo ""
echo "=== Deploying to server ==="

# Create release directory
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RELEASE_DIR="${APP_DIR}/releases/${TIMESTAMP}"

# Create dirs on server
ssh ${SERVER} "mkdir -p ${RELEASE_DIR} ${APP_DIR}/shared/public"

# Upload build
rsync -avz --delete .deploy/ ${SERVER}:${RELEASE_DIR}/

# Run database migrations
echo ""
echo "=== Running database migrations ==="
ssh ${SERVER} "set -a && source ${APP_DIR}/shared/.env.production && set +a && cd ${RELEASE_DIR} && npx prisma@6.19.2 migrate deploy"

# Regenerate Prisma client for Linux (build was generated on macOS)
echo ""
echo "=== Regenerating Prisma client for Linux ==="
ssh ${SERVER} "cd ${RELEASE_DIR} && npx prisma@6.19.2 generate"

# Update symlink
ssh ${SERVER} "ln -snf ${RELEASE_DIR} ${APP_DIR}/current"

# Copy public assets to shared (for nginx direct serving)
ssh ${SERVER} "cp -r ${RELEASE_DIR}/public/* ${APP_DIR}/shared/public/ 2>/dev/null || true"

# Restart service
ssh ${SERVER} "sudo systemctl restart wepac"

# Clean old releases (keep 5)
ssh ${SERVER} "cd ${APP_DIR}/releases && ls -t | tail -n +6 | xargs rm -rf 2>/dev/null || true"

# Cleanup local
rm -rf .deploy

echo ""
echo "=== Deploy complete! ==="
echo "Site: https://${DOMAIN}"
