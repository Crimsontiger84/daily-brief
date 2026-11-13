# Daily briefing pipeline: Gemini CLI refreshes data\news.json, then validate + deploy.
# Run manually:   powershell -ExecutionPolicy Bypass -File "C:\Users\a\Documents\Tech\scripts\run_daily_pipeline.ps1"
# Task Scheduler: Program = powershell.exe
#                 Arguments = -NoProfile -ExecutionPolicy Bypass -File "C:\Users\a\Documents\Tech\scripts\run_daily_pipeline.ps1"
# This file is ASCII-only on purpose (Windows PowerShell 5.1 misreads UTF-8 without BOM).
#
# Research step uses Gemini CLI headless mode:  gemini -p <prompt> --approval-mode auto_edit --skip-trust
# (Antigravity's own CLI only works inside the Antigravity app, so it cannot be scheduled.)
# One-time setup: run `gemini` once in a terminal and sign in with Google.

param(
    # Empty = Gemini CLI default model. Example: -Model gemini-2.5-pro
    [string]$Model = '',
    # auto_edit: file edits are auto-approved, shell commands are not (safer with web content).
    # yolo: everything auto-approved.
    [ValidateSet('auto_edit', 'yolo')]
    [string]$ApprovalMode = 'auto_edit',
    # Validate only, skip git commit/push.
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = 'C:\Users\a\Documents\Tech'
Set-Location $ProjectRoot

# Pick up PATH changes (fresh Git / Node installs) without needing a new login session.
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

# Use the .cmd shim: the .ps1 shim can be blocked by the execution policy.
$Gemini = Get-Command 'gemini.cmd' -ErrorAction SilentlyContinue
if (-not $Gemini) {
    Write-Log "ERROR: gemini.cmd not found in PATH. Install with: npm install -g @google/gemini-cli"
    exit 2
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Log "ERROR: 'python' not found in PATH."
    exit 2
}

$NewsFile = Join-Path $ProjectRoot 'data\news.json'
$Before = if (Test-Path $NewsFile) { (Get-Item $NewsFile).LastWriteTimeUtc } else { [datetime]::MinValue }

# Single line, no quotes or cmd metacharacters: the prompt passes through a .cmd wrapper.
$Prompt = 'Read SPEC.md and schema.json in the current folder. This is the daily refresh described in SPEC.md section 1 B. Use web search to find the latest global news of today in the three categories defined in SPEC.md, then overwrite ONLY data\news.json following SPEC.md section 2 and schema.json exactly. Do not modify any other file and do not run any git command. Write Korean text for korean_title, summary, pm_insights and executive_summary. Before finishing, re-read data\news.json and confirm it is valid JSON with 8 to 12 articles, at least 2 per category, unique ids and every required field.'

$GeminiArgs = @('-p', $Prompt, '--approval-mode', $ApprovalMode, '--skip-trust')
if ($Model) { $GeminiArgs += @('-m', $Model) }

# Native stderr merged with 2>&1 must not abort the script in Windows PowerShell 5.1.
$ErrorActionPreference = 'Continue'

Write-Log "Step 1/2: Gemini CLI refreshes data\news.json (approval-mode=$ApprovalMode)"
& $Gemini.Source @GeminiArgs 2>&1 | ForEach-Object { Add-Content -Path $LogFile -Value "$_" -Encoding utf8; Write-Host $_ }
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: gemini exited with code $LASTEXITCODE. If this is an auth error, run 'gemini' once and sign in. Deploy skipped."
    exit 1
}
if (-not (Test-Path $NewsFile) -or (Get-Item $NewsFile).LastWriteTimeUtc -le $Before) {
    Write-Log "ERROR: gemini finished but data\news.json was not rewritten. Deploy skipped."
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
