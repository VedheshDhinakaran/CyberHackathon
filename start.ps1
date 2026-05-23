# Start script for NetRecon Forensics Workbench (Windows)
Write-Host "==============================================="
Write-Host "   Starting NetRecon Forensics Workbench..."
Write-Host "==============================================="

# Check if Wireshark is installed and accessible
try {
    $tshark_version = tshark -v 2>&1
    Write-Host "tshark detected." -ForegroundColor Green
} catch {
    Write-Host "WARNING: 'tshark' is not recognized as an internal or external command." -ForegroundColor Yellow
    Write-Host "Ensure Wireshark is installed and its installation directory is in your system PATH." -ForegroundColor Yellow
    Write-Host "TCP stream reassembly and file extraction will fail without tshark." -ForegroundColor Yellow
    Write-Host ""
}

# Define job names so we can clean them up later
$backendJob = "NetReconBackend"
$frontendJob = "NetReconFrontend"

Write-Host "Starting Backend Service on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (!(Test-Path venv)) { python -m venv venv }; .\venv\Scripts\activate; pip install -r requirements.txt; uvicorn main:app --host 0.0.0.0 --port 8000" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev" -WindowStyle Normal

Write-Host "==============================================="
Write-Host "Services are starting up in new windows."
Write-Host "Backend API will be available at: http://localhost:8000"
Write-Host "Frontend UI will be available at: http://localhost:5173"
Write-Host "==============================================="
Write-Host "Press any key to exit this launcher window (services will continue running in their own windows)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
