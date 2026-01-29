# Windows PowerShell Startup Script
# Used to start both server and client simultaneously

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting CrowdSourcedTravelPlanner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Check if version is compatible (20.19+ or 22.12+)
    $versionMatch = $nodeVersion -match "v(\d+)\.(\d+)\.(\d+)"
    if ($versionMatch) {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        
        if (($major -eq 20 -and $minor -lt 19) -or ($major -lt 20)) {
            Write-Host ""
            Write-Host "WARNING: Node.js version may be too old!" -ForegroundColor Yellow
            Write-Host "Vite requires Node.js 20.19+ or 22.12+" -ForegroundColor Yellow
            Write-Host "Current version: $nodeVersion" -ForegroundColor Yellow
            Write-Host ""
            $continue = Read-Host "Continue anyway? (y/n)"
            if ($continue -ne "y") {
                Write-Host "Please upgrade Node.js from https://nodejs.org/" -ForegroundColor Red
                exit 1
            }
        }
    }
} catch {
    Write-Host "Error: Node.js not found. Please install Node.js 20.19+ or 22.12+ first" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "server/node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

# Check for .env file
if (-not (Test-Path "server/.env")) {
    Write-Host "Warning: server/.env file not found" -ForegroundColor Yellow
    Write-Host "Please create server/.env file and configure necessary environment variables" -ForegroundColor Yellow
    Write-Host "You can refer to server/env.example.txt" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue starting? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

Write-Host ""
Write-Host "IMPORTANT: Make sure Prisma dev is running!" -ForegroundColor Yellow
Write-Host "If not, start it in a separate window: cd server && npx prisma dev" -ForegroundColor Yellow
Write-Host ""
$continue = Read-Host "Continue starting server and client? (y/n)"
if ($continue -ne "y") {
    exit 0
}

Write-Host ""
Write-Host "Starting server and client..." -ForegroundColor Green
Write-Host ""

# Start server (in a new window)
Write-Host "Starting server (http://localhost:10000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm run start:dev"

# Wait a bit for server to start
Start-Sleep -Seconds 3

# Start client (in a new window)
Write-Host "Starting client (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Server and client started!" -ForegroundColor Green
Write-Host "Server: http://localhost:10000" -ForegroundColor Green
Write-Host "Client: http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Press any key to close this window (server and client will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
