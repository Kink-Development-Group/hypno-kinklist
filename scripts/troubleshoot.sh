#!/bin/bash

# Troubleshooting script for CI/CD issues
# Usage: ./scripts/troubleshoot.sh

echo "🔍 Neo-Kinklist CI/CD Troubleshooting"
echo "======================================"

# Check build directory
echo ""
echo "📁 Checking build directory..."
if [ -d "./build" ]; then
    echo "✅ Build directory exists"
    echo "📋 Build contents:"
    ls -la ./build/
    
    if [ -f "./build/index.html" ]; then
        echo "✅ index.html found"
        echo "📏 Size: $(du -h ./build/index.html | cut -f1)"
    else
        echo "❌ index.html NOT found"
    fi
else
    echo "❌ Build directory does not exist"
    echo "💡 Run 'npm run build' first"
fi

# Check package.json scripts
echo ""
echo "📜 Checking package.json scripts..."
if [ -f "./package.json" ]; then
    echo "✅ package.json exists"
    echo "🔧 Available scripts:"
    node -e "
        const pkg = require('./package.json');
        const scripts = pkg.scripts || {};
        Object.keys(scripts).forEach(key => {
            console.log('  ' + key + ': ' + scripts[key]);
        });
    "
else
    echo "❌ package.json NOT found"
fi

# Check dependencies
echo ""
echo "📦 Checking dependencies..."
if [ -d "./node_modules" ]; then
    echo "✅ node_modules exists"
    echo "📊 Size: $(du -sh ./node_modules | cut -f1)"
else
    echo "❌ node_modules NOT found"
    echo "💡 Run 'npm install' or 'npm ci'"
fi

# Check Git information
echo ""
echo "🔀 Git information..."
if [ -d "./.git" ]; then
    echo "✅ Git repository found"
    echo "🌿 Current branch: $(git branch --show-current)"
    echo "📝 Last commit: $(git log -1 --oneline)"
else
    echo "❌ Not a Git repository"
fi

# Check environment variables (safe check)
echo ""
echo "🔐 Environment check..."
echo "📊 NODE_ENV: ${NODE_ENV:-'not set'}"
echo "🏗️ CI: ${CI:-'not set'}"

# Test build process
echo ""
echo "🧪 Testing build process..."
if command -v npm >/dev/null 2>&1; then
    echo "✅ npm available"
    echo "📋 npm version: $(npm --version)"
    
    if [ -f "./package.json" ]; then
        echo "🏗️ Attempting test build..."
        npm run build 2>&1 | head -20
        
        if [ $? -eq 0 ]; then
            echo "✅ Build completed successfully"
        else
            echo "❌ Build failed"
        fi
    fi
else
    echo "❌ npm not available"
fi

echo ""
echo "🎯 Troubleshooting complete!"
echo ""
echo "📚 Common solutions:"
echo "  • Missing build dir: Run 'npm run build'"
echo "  • Missing node_modules: Run 'npm ci'"
echo "  • Permission issues: Check server permissions"
echo "  • SSH issues: Verify credentials and connectivity"
