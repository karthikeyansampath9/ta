@echo off
echo ========================================================
echo  ApexRetail Global Pricing Platform (3,000 Stores)
echo ========================================================
echo.
echo 1. Checking Python and dependencies...
python -m pip install -r backend/requirements.txt --quiet

echo 2. Checking Frontend Build...
if not exist "frontend\dist\index.html" (
    echo Building frontend...
    cd frontend
    call npm install --quiet
    call npm run build
    cd ..
)

echo.
echo 3. Starting Unified Application Server...
echo --------------------------------------------------------
echo  Web Application:   http://localhost:8000
echo  Swagger API Docs:  http://localhost:8000/docs
echo  Health Check:      http://localhost:8000/health
echo --------------------------------------------------------
echo.
python backend/run.py
pause
