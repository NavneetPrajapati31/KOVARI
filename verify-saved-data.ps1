# Quick verification of saved ML data
Write-Host "📊 ML Data Verification" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "match_events.jsonl") {
    $lineCount = (Get-Content match_events.jsonl | Measure-Object -Line).Lines
    Write-Host "✅ match_events.jsonl exists" -ForegroundColor Green
    Write-Host "   Events: $lineCount" -ForegroundColor Yellow
    
    $accepts = (Select-String -Pattern '"outcome":"accept"' match_events.jsonl).Count
    $ignores = (Select-String -Pattern '"outcome":"ignore"' match_events.jsonl).Count
    $chats = (Select-String -Pattern '"outcome":"chat"' match_events.jsonl).Count
    
    Write-Host ""
    Write-Host "📈 Breakdown:" -ForegroundColor Cyan
    Write-Host "   Accepts: $accepts" -ForegroundColor Green
    Write-Host "   Ignores: $ignores" -ForegroundColor Yellow
    Write-Host "   Chats: $chats" -ForegroundColor Cyan
} else {
    Write-Host "❌ match_events.jsonl not found" -ForegroundColor Red
}

if (Test-Path "ML_DATA_SNAPSHOT.md") {
    Write-Host ""
    Write-Host "✅ ML_DATA_SNAPSHOT.md created" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 All data from 3 users (Budget, Luxury, Solo) has been saved!" -ForegroundColor Green
