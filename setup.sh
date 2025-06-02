#!/bin/bash

echo "🚀 Setting up EasyPanel Monitor..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Clear npm cache if there are permission issues
echo "🧹 Clearing npm cache..."
npm cache clean --force 2>/dev/null || echo "⚠️  Cache clean failed, continuing..."

# Try to fix npm permissions
echo "🔧 Attempting to fix npm permissions..."
sudo chown -R $(whoami) ~/.npm 2>/dev/null || echo "⚠️  Permission fix failed, continuing..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --force || {
    echo "❌ npm install failed. Trying alternative methods..."
    
    # Try with different registry
    echo "🔄 Trying with different npm registry..."
    npm install --registry https://registry.npmjs.org/ --force || {
        echo "❌ Installation failed. Please try manual installation:"
        echo ""
        echo "1. Delete node_modules and package-lock.json if they exist:"
        echo "   rm -rf node_modules package-lock.json"
        echo ""
        echo "2. Try installing with yarn instead:"
        echo "   npm install -g yarn"
        echo "   yarn install"
        echo ""
        echo "3. Or install dependencies one by one:"
        echo "   npm install next@14.0.3"
        echo "   npm install react@^18 react-dom@^18"
        echo "   npm install @radix-ui/react-dialog @radix-ui/react-slot"
        echo "   npm install class-variance-authority clsx lucide-react"
        echo "   npm install tailwind-merge tailwindcss-animate"
        echo "   npm install -D typescript @types/node @types/react @types/react-dom"
        echo "   npm install -D autoprefixer postcss tailwindcss eslint eslint-config-next"
        exit 1
    }
}

echo "✅ Dependencies installed successfully!"

# Run development server
echo "🎉 Setup complete! Starting development server..."
echo "📱 Open http://localhost:3000 in your browser"
echo ""
echo "To start the server manually later, run: npm run dev"
echo ""

npm run dev 