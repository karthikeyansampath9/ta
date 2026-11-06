# ApexRetail Global Pricing Platform Run Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " ApexRetail Global Pricing Platform (3,000 Stores)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -r backend/requirements.txt --quiet

if (-not (Test-Path "frontend/dist/index.html")) {
    Write-Host "2. Building Frontend SPA..." -ForegroundColor Yellow
    Push-Location frontend
    npm install --quiet
    npm run build
    Pop-Location
} else {
    Write-Host "2. Frontend SPA build verified." -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Starting Server on http://localhost:8000 ..." -ForegroundColor Cyan
Write-Host "   - Single Page Web App: http://localhost:8000" -ForegroundColor Green
Write-Host "   - Interactive Swagger:  http://localhost:8000/docs" -ForegroundColor Green
Write-Host "   - System Health:        http://localhost:8000/health" -ForegroundColor Green
Write-Host ""

python backend/run.py
