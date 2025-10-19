@echo off
echo 🚀 Setting up Rich OneBox Emails...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Copy environment file
if not exist .env (
    echo 📝 Creating environment file...
    copy env.example .env
    echo ⚠️  Please edit .env file with your configuration before starting the application
)

REM Start infrastructure services
echo 🐳 Starting infrastructure services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose ps

REM Build the application
echo 🔨 Building the application...
npm run build

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Run 'npm start' to start the application
echo 3. Visit http://localhost:3000 to access the web interface
echo 4. Use the Postman collection to test the API
echo.
echo For development, use 'npm run dev' instead of 'npm start'
pause

