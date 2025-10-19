#!/bin/bash

echo "🚀 Setting up Rich OneBox Emails..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the application"
fi

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 45

# Check if services are healthy
echo "🔍 Checking service health..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Build the application
echo "🔨 Building the application..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm start' to start the application"
echo "3. Visit http://localhost:3000 to access the web interface"
echo "4. Use the Postman collection to test the API"
echo ""
echo "For development, use 'npm run dev' instead of 'npm start'"

