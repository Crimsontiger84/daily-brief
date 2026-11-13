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
    [switch]$CheckOnly
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
$Before = if (Test-Path $NewsFile) { (Get-Item $NewsFile).LastWriteTimeUtc } else { [datetime]::MinValue }

# No double quotes inside the prompt: Windows PowerShell 5.1 mangles them when passing to an exe.
$Prompt = 'Read SPEC.md and schema.json in the current folder. This is the daily refresh described in SPEC.md section 1 B. Use web search to find the latest global news of today in the three categories defined in SPEC.md, then overwrite ONLY data\news.json following SPEC.md section 2 and schema.json exactly. Do not modify any other file. Do not run any shell or terminal command at all, including git and python: they are blocked in this unattended run and will abort it. Use only the file read, file write and web search tools. Write Korean text for korean_title, summary, pm_insights and executive_summary. Before finishing, re-read data\news.json and confirm it is valid JSON with 8 to 12 articles, at least 2 per category, unique ids and every required field.'

$AgyArgs = @('-p', $Prompt, '--mode', $Mode, '--print-timeout', "${TimeoutMinutes}m")
if ($Model) { $AgyArgs += @('--model', $Model) }

# Native stderr merged with 2>&1 must not abort the script in Windows PowerShell 5.1.
$ErrorActionPreference = 'Continue'

Write-Log "Step 1/2: agy refreshes data\news.json (mode=$Mode, timeout=${TimeoutMinutes}m)"
& $Agy.Source @AgyArgs 2>&1 | ForEach-Object { Add-Content -Path $LogFile -Value "$_" -Encoding utf8; Write-Host $_ }
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: agy exited with code $LASTEXITCODE. If this is an auth error, run 'agy' once and sign in. Deploy skipped."
    exit 1
}
if (-not (Test-Path $NewsFile) -or (Get-Item $NewsFile).LastWriteTimeUtc -le $Before) {
    Write-Log "ERROR: agy finished but data\news.json was not rewritten. Deploy skipped."
    exit 1
}

Write-Log "Step 2/2: validate and deploy"
$PyArgs = @('scripts\validate_and_deploy.py')
if ($CheckOnly) { $PyArgs += '--check' }
& python @PyArgs 2>&1 | ForEach-Object { Add-Content -Path $LogFile -Value "$_" -Encoding utf8; Write-Host $_ }
$code = $LASTEXITCODE
if ($code -ne 0) {
    Write-Log "ERROR: validate_and_deploy.py exited with code $code. See $LogFile"
    exit $code
}

Write-Log "Done."
exit 0
