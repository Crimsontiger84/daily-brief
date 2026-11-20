# Daily briefing pipeline: Antigravity CLI (agy) refreshes data\news.json, then validate + deploy.
# Run manually:   powershell -ExecutionPolicy Bypass -File "C:\Users\a\Documents\Tech\scripts\run_daily_pipeline.ps1"
# Task Scheduler: Program = powershell.exe
#                 Arguments = -NoProfile -ExecutionPolicy Bypass -File "C:\Users\a\Documents\Tech\scripts\run_daily_pipeline.ps1"
# This file is ASCII-only on purpose (Windows PowerShell 5.1 misreads UTF-8 without BOM).
#
# Research step:  agy -p <prompt> --mode <mode> --print-timeout <N>m
# agy is installed with:  winget install --id Google.AntigravityCLI -e
# It shares the Google sign-in of the Antigravity app; if auth fails, run `agy` once in a terminal.

param(
    # Empty = agy default model. See `agy models`.
    [string]$Model = '',
    # accept-edits: file edits are auto-approved, other tools are not (safer with web content).
    # auto: agy decides what to approve.
    [ValidateSet('accept-edits', 'auto')]
    [string]$Mode = 'accept-edits',
    # Time limit for the research step.
    [int]$TimeoutMinutes = 20,
    # Validate only, skip git commit/push.
    [switch]$CheckOnly,
    # Refresh even if data\news.json was already updated today (KST).
    [switch]$Force,
    # Attempts for the research step. A hung agy is killed after TimeoutMinutes + 5 and retried.
    [int]$MaxAttempts = 2
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = 'C:\Users\a\Documents\Tech'
Set-Location $ProjectRoot

# Pick up PATH changes (fresh Git / agy installs) without needing a new login session.
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$env:PYTHONIOENCODING = 'utf-8'

$LogDir = Join-Path $ProjectRoot 'logs'
New-Item -ItemType Directory -Force $LogDir | Out-Null
$LogFile = Join-Path $LogDir ("pipeline_{0}.log" -f (Get-Date -Format 'yyyyMMdd_HHmmss'))

function Write-Log([string]$Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding utf8
}

$Agy = Get-Command 'agy.exe' -ErrorAction SilentlyContinue
if (-not $Agy) {
    $Fallback = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Google.AntigravityCLI_Microsoft.Winget.Source_8wekyb3d8bbwe\agy.exe'
    if (Test-Path $Fallback) { $Agy = Get-Command $Fallback }
}
if (-not $Agy) {
    Write-Log "ERROR: agy.exe not found. Install with: winget install --id Google.AntigravityCLI -e"
    exit 2
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Log "ERROR: 'python' not found in PATH."
    exit 2
}

$NewsFile = Join-Path $ProjectRoot 'data\news.json'

# The task also fires at logon / unlock as a catch-up, so skip when today's briefing already exists.
if (-not $Force -and (Test-Path $NewsFile)) {
    try {
        $stamp = [string](Get-Content $NewsFile -Raw -Encoding utf8 | ConvertFrom-Json).updated_at
        if ($stamp.StartsWith((Get-Date -Format 'yyyy-MM-dd'))) {
            Write-Log "Skip: data\news.json already updated today ($stamp). Use -Force to refresh again."
            exit 0
        }
    } catch {
        Write-Log "Note: could not read updated_at, refreshing anyway."
    }
}

$Before = if (Test-Path $NewsFile) { (Get-Item $NewsFile).LastWriteTimeUtc } else { [datetime]::MinValue }

# No double quotes inside the prompt: Windows PowerShell 5.1 mangles them when passing to an exe.
$Prompt = 'Read SPEC.md and schema.json in the current folder. This is the daily refresh described in SPEC.md section 1 B. Use web search to find the latest global news of today in the three categories defined in SPEC.md, then overwrite ONLY data\news.json following SPEC.md section 2 and schema.json exactly. Do not modify any other file. The only shell command you may run is exactly: python scripts\validate_and_deploy.py --check (type it exactly like that, with no other arguments and nothing before or after it). Every other command, including git, is blocked in this unattended run. Otherwise use only file read, file write, web search and URL reading tools. SPEC.md section 5 overrides earlier sections, and 5.6 overrides the rest of section 5: cover the four categories including Science and Research, write 10 to 14 articles with at least 4 golf articles of which at least half are golf business news, use at most 2 articles from the same outlet and draw on the wider outlet list in 5.6, pick the most talked-about stories of the day in each category, use mainly US and UK sources, and fill the English fields (executive_summary_en, english_title, summary_en, pm_insights_en) in plain, easy English as described in 5.2. Write Korean text for korean_title, summary, pm_insights and executive_summary. Every source_url must be the exact address of a published article page that you opened and confirmed loads, copied from the page itself: never guess or assemble a URL from a title, and never use vertexaisearch or grounding-api-redirect addresses. After writing data\news.json, run python scripts\validate_and_deploy.py --check . It opens every source_url for real. If it prints FAIL, fix every listed problem (for a broken link, find the real article page and copy its exact URL, or replace the story) and run it again, repeating until it prints PASS.'

# Lets agy run exactly one command: the validator in --check mode (it opens every source_url).
$AgySettings = Join-Path $ProjectRoot 'scripts\agy_settings.json'

# Native stderr merged with 2>&1 must not abort the script in Windows PowerShell 5.1.
$ErrorActionPreference = 'Continue'

# Runs agy as a background job so a hang (e.g. right after the PC wakes from sleep) can be killed.
# $Marker is a phrase from the prompt, used to find and kill the right agy process.
function Invoke-Agy([string]$TaskPrompt, [string]$Marker, [int]$Minutes) {
    $argList = @('-p', $TaskPrompt, '--mode', $Mode, '--print-timeout', "${Minutes}m", '--settings', $AgySettings)
    if ($Model) { $argList += @('--model', $Model) }
    $job = Start-Job -ScriptBlock {
        param($exe, $jobArgs, $dir)
        Set-Location $dir
        & $exe @jobArgs 2>&1 | ForEach-Object { "$_" }
        "AGY_EXIT=$LASTEXITCODE"
    } -ArgumentList $Agy.Source, $argList, $ProjectRoot

    $done = Wait-Job $job -Timeout (($Minutes + 5) * 60)
    $output = Receive-Job $job -ErrorAction SilentlyContinue
    if ($output) { $output | ForEach-Object { Add-Content -Path $LogFile -Value "$_" -Encoding utf8; Write-Host $_ } }
    if (-not $done) {
        Write-Log "WARN: agy did not finish within $($Minutes + 5) minutes. Killing it."
        Stop-Job $job
        Get-CimInstance Win32_Process -Filter "Name='agy.exe'" |
            Where-Object { $_.CommandLine -like "*$Marker*" } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    }
    Remove-Job $job -Force
    $exitLine = @($output) | Where-Object { "$_" -like 'AGY_EXIT=*' } | Select-Object -Last 1
    if ($done -and $exitLine -and "$exitLine" -ne 'AGY_EXIT=0') {
        Write-Log "WARN: agy failed ($exitLine). If this is an auth error, run 'agy' once and sign in."
    }
}

function Invoke-Validate([string[]]$ExtraArgs) {
    $lines = & python scripts\validate_and_deploy.py @ExtraArgs 2>&1 | ForEach-Object { "$_" }
    $code = $LASTEXITCODE
    $lines | ForEach-Object { Add-Content -Path $LogFile -Value $_ -Encoding utf8; Write-Host $_ }
    return @{ Code = $code; Lines = $lines }
}

$Refreshed = $false
for ($attempt = 1; $attempt -le $MaxAttempts -and -not $Refreshed; $attempt++) {
    Write-Log "Step 1/3: agy refreshes data\news.json (attempt $attempt/$MaxAttempts, mode=$Mode, limit=$($TimeoutMinutes + 5)m)"
    Invoke-Agy $Prompt 'daily refresh described in SPEC.md' $TimeoutMinutes
    $Refreshed = (Test-Path $NewsFile) -and (Get-Item $NewsFile).LastWriteTimeUtc -gt $Before
    if (-not $Refreshed -and $attempt -lt $MaxAttempts) {
        Write-Log "Retrying in 60 seconds."
        Start-Sleep -Seconds 60
    }
}
if (-not $Refreshed) {
    Write-Log "ERROR: data\news.json was not rewritten after $MaxAttempts attempts. Deploy skipped."
    exit 1
}

# Step 2: validate (schema + live link check). On failure, hand the exact errors back to agy to fix.
Write-Log "Step 2/3: validate, and let agy repair failures"
$result = Invoke-Validate @('--check')
for ($round = 1; $result.Code -eq 1 -and $round -le $MaxAttempts; $round++) {
    $problems = (@($result.Lines) | Where-Object { $_ -match '^\s+- ' } | ForEach-Object { $_.Trim() -replace '"', '' }) -join ' | '
    Write-Log "Repair round $round/${MaxAttempts}: agy fixes validation errors"
    $RepairPrompt = "Repair data\news.json in the current folder so it passes validation. Read SPEC.md and schema.json first. Validation errors: $problems. For any article whose source_url does not open, use web search to find the real published article on the same story and set source_url to its exact working URL copied from the page, updating source_name, original_title and published_date to match; if no real article exists, replace that article with a different real, current story in the same category, keeping its id. Never guess URLs and never use vertexaisearch or grounding-api-redirect addresses. Change only what is needed to fix these errors and do not touch any other file. When done, run exactly: python scripts\validate_and_deploy.py --check and repeat the fixes until it prints PASS. Every other shell command is blocked in this unattended run."
    Invoke-Agy $RepairPrompt 'Repair data\news.json in the current folder' 15
    $result = Invoke-Validate @('--check')
}
if ($result.Code -ne 0) {
    Write-Log "ERROR: validation still fails (exit $($result.Code)). Deploy skipped. See $LogFile"
    exit $result.Code
}

if ($CheckOnly) {
    Write-Log "Check only: deploy skipped."
} else {
    Write-Log "Step 3/3: deploy"
    # Links were checked just above; skip the second round of HTTP requests.
    $result = Invoke-Validate @('--no-links')
    if ($result.Code -ne 0) {
        Write-Log "ERROR: validate_and_deploy.py exited with code $($result.Code). See $LogFile"
        exit $result.Code
    }
}

Write-Log "Done."
exit 0
