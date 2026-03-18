# PowerShell script to verify dataset quality
# Usage: .\verify-dataset.ps1 [train-csv] [val-csv]

param(
    [string]$TrainCsv = "datasets/train.csv",
    [string]$ValCsv = "datasets/val.csv"
)

Write-Host "🔍 Verifying dataset quality..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $TrainCsv)) {
    Write-Host "❌ Error: Training CSV file '$TrainCsv' not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ValCsv)) {
    Write-Host "❌ Error: Validation CSV file '$ValCsv' not found!" -ForegroundColor Red
    exit 1
}

$train = Import-Csv $TrainCsv
$val = Import-Csv $ValCsv

$checksPassed = 0
$checksTotal = 0

# Check 1: Basic counts
Write-Host "📊 Basic Statistics:" -ForegroundColor Yellow
Write-Host "  Train samples: $($train.Count)"
Write-Host "  Val samples: $($val.Count)"
Write-Host "  Total samples: $($train.Count + $val.Count)"
Write-Host ""

# Check 2: Match types
Write-Host "📈 Match Types:" -ForegroundColor Yellow
$trainTypes = $train | Group-Object matchType
$valTypes = $val | Group-Object matchType

$hasUserUser = $false
$hasUserGroup = $false

foreach ($type in $trainTypes) {
    Write-Host "  Train $($type.Name): $($type.Count)"
    if ($type.Name -eq "user_user") { $hasUserUser = $true }
    if ($type.Name -eq "user_group") { $hasUserGroup = $true }
}

foreach ($type in $valTypes) {
    Write-Host "  Val $($type.Name): $($type.Count)"
}

$checksTotal++
if ($hasUserUser -and $hasUserGroup) {
    Write-Host "  ✅ Both match types present" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "  ❌ Missing match types (need both user_user and user_group)" -ForegroundColor Red
}
Write-Host ""

# Check 3: Labels
Write-Host "📊 Labels:" -ForegroundColor Yellow
$trainLabels = $train | Group-Object label
$valLabels = $val | Group-Object label

$hasLabel0 = $false
$hasLabel1 = $false

foreach ($label in $trainLabels) {
    $percentage = [math]::Round($label.Count / $train.Count * 100, 1)
    Write-Host "  Train label $($label.Name): $($label.Count) ($percentage%)"
    if ($label.Name -eq "0") { $hasLabel0 = $true }
    if ($label.Name -eq "1") { $hasLabel1 = $true }
}

foreach ($label in $valLabels) {
    $percentage = [math]::Round($label.Count / $val.Count * 100, 1)
    Write-Host "  Val label $($label.Name): $($label.Count) ($percentage%)"
}

$checksTotal++
if ($hasLabel0 -and $hasLabel1) {
    Write-Host "  ✅ Both labels (0 and 1) present" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "  ❌ Missing labels (need both 0 and 1)" -ForegroundColor Red
}
Write-Host ""

# Check 4: PII columns (basic check)
Write-Host "🔒 PII Check:" -ForegroundColor Yellow
$headers = ($train | Get-Member -MemberType NoteProperty).Name
$piiColumns = $headers | Where-Object { 
    $_ -match 'email|name|phone|address|user_id|profile_id|group_id|clerk' -and 
    $_ -notmatch 'matchType|preset|timestamp|label' 
}

$checksTotal++
if ($piiColumns.Count -eq 0) {
    Write-Host "  ✅ No obvious PII columns found" -ForegroundColor Green
    $checksPassed++
} else {
    Write-Host "  ⚠️  Potential PII columns found: $($piiColumns -join ', ')" -ForegroundColor Yellow
    Write-Host "     Review manually to ensure no PII is included" -ForegroundColor Yellow
}
Write-Host ""

# Check 5: Time-based split (requires Python)
Write-Host "⏰ Time-Based Split:" -ForegroundColor Yellow
Write-Host "  ⚠️  Run Python check for time-based split verification:" -ForegroundColor Yellow
Write-Host "     python -c `"import pandas as pd; train=pd.read_csv('$TrainCsv'); val=pd.read_csv('$ValCsv'); print('✅ Time split OK' if val['timestamp'].min() >= train['timestamp'].max() else '❌ Time split violated')`"" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "Summary: $checksPassed/$checksTotal checks passed" -ForegroundColor $(if ($checksPassed -eq $checksTotal) { "Green" } else { "Yellow" })
Write-Host ""

if ($checksPassed -eq $checksTotal) {
    Write-Host "✅ Basic verification passed!" -ForegroundColor Green
    Write-Host "💡 Remember to run Python checks for feature ranges [0,1] and time-based split" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some checks failed. Review the output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify feature columns are in [0,1] range (use Python)"
Write-Host "  2. Verify time-based split is respected (use Python)"
Write-Host "  3. Review dataset quality and balance"
Write-Host ""

