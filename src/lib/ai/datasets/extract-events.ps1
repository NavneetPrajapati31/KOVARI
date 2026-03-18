# PowerShell script to extract ML match events from app.log
# Usage: .\extract-events.ps1 [log-file] [output-file]

param(
    [string]$LogFile = "app.log",
    [string]$OutputFile = "match_events.jsonl"
)

Write-Host "🔍 Extracting ML match events from $LogFile..." -ForegroundColor Cyan

if (-not (Test-Path $LogFile)) {
    Write-Host "❌ Error: Log file '$LogFile' not found!" -ForegroundColor Red
    exit 1
}

# Extract events and clean up the format
$events = Select-String -Pattern "\[ML_MATCH_EVENT\]" $LogFile | ForEach-Object {
    # Remove everything before [ML_MATCH_EVENT] and the marker itself
    $_.Line -replace '.*\[ML_MATCH_EVENT\]\s*', ''
} | Where-Object { $_.Trim() -ne '' }

if ($events.Count -eq 0) {
    Write-Host "⚠️  Warning: No ML match events found in $LogFile" -ForegroundColor Yellow
    Write-Host "   Make sure you performed match actions and the app is logging events." -ForegroundColor Yellow
    exit 1
}

# Write to output file
$events | Out-File -FilePath $OutputFile -Encoding utf8

Write-Host "✅ Extracted $($events.Count) events to $OutputFile" -ForegroundColor Green

# Show statistics
Write-Host "`n📊 Event Statistics:" -ForegroundColor Cyan
Write-Host "   Total events: $($events.Count)"

$userUserCount = ($events | Select-String -Pattern '"matchType":"user_user"').Count
$userGroupCount = ($events | Select-String -Pattern '"matchType":"user_group"').Count
Write-Host "   User-User matches: $userUserCount"
Write-Host "   User-Group matches: $userGroupCount"

$acceptCount = ($events | Select-String -Pattern '"outcome":"accept"').Count
$chatCount = ($events | Select-String -Pattern '"outcome":"chat"').Count
$ignoreCount = ($events | Select-String -Pattern '"outcome":"ignore"').Count
$unmatchCount = ($events | Select-String -Pattern '"outcome":"unmatch"').Count

Write-Host "`n📈 Outcome Distribution:" -ForegroundColor Cyan
Write-Host "   Accept: $acceptCount"
Write-Host "   Chat: $chatCount"
Write-Host "   Ignore: $ignoreCount"
Write-Host "   Unmatch: $unmatchCount"

Write-Host "`n✅ Extraction complete! Next step:" -ForegroundColor Green
Write-Host "   python src/lib/ai/datasets/build_training_set.py $OutputFile" -ForegroundColor Yellow

