#!/bin/bash

# HonestInvoice Vercel Deployment Script (Simple)
# This script deploys the pre-built dist folder to Vercel

echo "🚀 HonestInvoice Vercel Deployment"
echo "================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the honestinvoice project directory."
    exit 1
fi

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found. Building project first..."
    echo "📦 Running production build..."
    npm run build:prod
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing globally..."
    npm install -g vercel
fi

# Login to Vercel if not already logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "Project: HonestInvoice"
echo "Directory: ./dist"
echo ""

vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should be live on Vercel"
echo ""
echo "To view the deployment:"
echo "  vercel ls"
echo "  vercel logs"