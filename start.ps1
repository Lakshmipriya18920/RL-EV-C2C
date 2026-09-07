Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Starting COOKED EV Charging Reinforcement Learning Platform" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all servers.`n"

python run.py
