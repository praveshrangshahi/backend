#!/bin/bash

# YMS Backend - Quick Deployment Script
# Run this on your VPS after uploading the code

echo "🚀 Starting YMS Backend Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found! Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env file with your production values!"
    echo "   Run: nano .env"
fi

# Start with PM2
echo "🔄 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Restart PM2: pm2 restart yms-backend"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs yms-backend"
