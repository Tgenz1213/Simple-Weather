# setup-env.ps1
# PowerShell script to create or update .env.local from .env.example
param()

# Ensure .env.example exists
if (-not (Test-Path -Path '.env.example')) {
  Write-Host ".env.example not found — creating a default .env.example"
  @"
ENV_MODE=srh
SRH_MODE=env
SRH_TOKEN=your_token_here
SRH_CONNECTION_STRING=redis://localhost:6379
SRH_PORT=8080
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
"@ | Out-File -Encoding UTF8 .env.example
}

if (Test-Path -Path '.env.local') {
  $ans = Read-Host ".env.local already exists. Overwrite? (y/N):"
  if ($ans -ne 'y') {
    Write-Host "Keeping existing .env.local"
    exit 0
  }
}

Copy-Item -Path .env.example -Destination .env.local -Force

# Prompt for ENV_MODE
$mode = Read-Host "Choose ENV_MODE (srh/upstash) [srh]"
if ($mode) {
  (Get-Content .env.local) -replace '^ENV_MODE=.*', "ENV_MODE=$mode" | Set-Content .env.local
}

# Reload .env.local values into environment for this script
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^(\w+)=(.*)$') {
    $name = $matches[1]
    $value = $matches[2]
    Set-Variable -Name $name -Value $value -Scope Local
  }
}

$envMode = ($ENV_MODE -ne $null) ? $ENV_MODE : 'srh'
$envMode = $envMode.ToLower()

if ($envMode -eq 'upstash') {
  Write-Host "ENV_MODE=upstash selected. Please enter Upstash values."
  $upr = Read-Host "Enter UPSTASH_REDIS_REST_URL (leave empty to keep placeholder or existing value)"
  if ($upr) { (Get-Content .env.local) -replace '^UPSTASH_REDIS_REST_URL=.*', "UPSTASH_REDIS_REST_URL=$upr" | Set-Content .env.local }
  $upt = Read-Host "Enter UPSTASH_REDIS_REST_TOKEN (leave empty to keep placeholder or existing value)"
  if ($upt) { (Get-Content .env.local) -replace '^UPSTASH_REDIS_REST_TOKEN=.*', "UPSTASH_REDIS_REST_TOKEN=$upt" | Set-Content .env.local }
} else {
  Write-Host "ENV_MODE=$envMode selected. Please enter SRH values."
  $token = Read-Host "Enter SRH_TOKEN (leave empty to keep placeholder or existing value)"
  if ($token) { (Get-Content .env.local) -replace '^SRH_TOKEN=.*', "SRH_TOKEN=$token" | Set-Content .env.local }
  $conn = Read-Host "Enter SRH_CONNECTION_STRING (leave empty to keep placeholder or existing value)"
  if ($conn) { (Get-Content .env.local) -replace '^SRH_CONNECTION_STRING=.*', "SRH_CONNECTION_STRING=$conn" | Set-Content .env.local }
}

Write-Host ".env.local created/updated. Preview:"
Get-Content .env.local | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
exit 0
