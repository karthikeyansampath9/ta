#!/usr/bin/env bash
set -e

echo "========================================================"
echo " ApexRetail Global Pricing Platform (3,000 Stores)"
echo "========================================================"
echo ""

echo "1. Installing Python dependencies..."
python3 -m pip install -r backend/requirements.txt --quiet

if [ ! -f "frontend/dist/index.html" ]; then
    echo "2. Building Frontend SPA..."
    cd frontend
    npm install --quiet
    npm run build
    cd ..
else
    echo "2. Frontend SPA build verified."
fi

echo ""
echo "3. Starting Server on http://localhost:8000 ..."
echo "   - Web Application:   http://localhost:8000"
echo "   - Swagger API Docs:  http://localhost:8000/docs"
echo "   - Health Check:      http://localhost:8000/health"
echo "========================================================"
echo ""

python3 backend/run.py
