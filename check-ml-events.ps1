# Quick script to check ML events in app.log
Write-Host "Checking ML Match Events..." -ForegroundColor Cyan
Write-Host ""

$eventCount = (Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log).Count
Write-Host "Total ML events found: $eventCount" -ForegroundColor Yellow

if ($eventCount -gt 0) {
    Write-Host ""
    Write-Host "Recent events:" -ForegroundColor Green
    Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | Select-Object -Last 5 | ForEach-Object {
        Write-Host "  $($_.Line.Substring(0, [Math]::Min(100, $_.Line.Length)))" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Event breakdown:" -ForegroundColor Cyan
    $accepts = (Select-String -Pattern '"outcome":"accept"' app.log).Count
    $chats = (Select-String -Pattern '"outcome":"chat"' app.log).Count
    $ignores = (Select-String -Pattern '"outcome":"ignore"' app.log).Count
    $userUser = (Select-String -Pattern '"matchType":"user_user"' app.log).Count
    $userGroup = (Select-String -Pattern '"matchType":"user_group"' app.log).Count
    
    Write-Host "  Accepts: $accepts" -ForegroundColor Green
    Write-Host "  Chats: $chats" -ForegroundColor Green
    Write-Host "  Ignores: $ignores" -ForegroundColor Yellow
    Write-Host "  User-User: $userUser" -ForegroundColor Cyan
    Write-Host "  User-Group: $userGroup" -ForegroundColor Cyan
} else {
    Write-Host "No ML events found yet." -ForegroundColor Yellow
    Write-Host "Make sure you're performing actions (Skip, Interested, Accept) on matches." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Tip: Run this script periodically to track your progress!" -ForegroundColor Cyan
