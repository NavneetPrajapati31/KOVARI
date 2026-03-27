# PowerShell script to verify ML training dataset quality
# Usage: .\verify-dataset.ps1 [train-csv] [val-csv]

param(
    [string]$TrainCsv = "datasets/train.csv",
    [string]$ValCsv = "datasets/val.csv"
)

Write-Host "🔍 Verifying ML training datasets..." -ForegroundColor Cyan

# Check if files exist
if (-not (Test-Path $TrainCsv)) {
    Write-Host "❌ Error: Training CSV '$TrainCsv' not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ValCsv)) {
    Write-Host "❌ Error: Validation CSV '$ValCsv' not found!" -ForegroundColor Red
    exit 1
}

# Run Python verification script
python packages/api/src/ai/datasets/verify_dataset.py $TrainCsv $ValCsv

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 Dataset verification passed!" -ForegroundColor Green
    Write-Host "   You can now proceed to model training." -ForegroundColor Green
    Write-Host "`nNext step:" -ForegroundColor Cyan
    Write-Host "   python packages/api/src/ai/datasets/train_model.py" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Dataset verification failed!" -ForegroundColor Red
    Write-Host "   Please review the issues above and fix your data collection or extraction." -ForegroundColor Red
    exit 1
}
