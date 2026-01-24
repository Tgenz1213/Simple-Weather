<#
.SYNOPSIS
    Environment setup script for .env.local generation.
.DESCRIPTION
    Validates requirements, gathers user input, and performs a single-pass write 
    using BOM-less UTF-8 encoding for Task/Vite compatibility.
#>

#region Configuration
$ExamplePath = "./.env.example"
$LocalPath = "./.env.local"

# [Hashtable] Initialize state
$EnvState = New-Object -TypeName Hashtable
$EnvState.ENV_MODE = "srh"
$EnvState.SRH_TOKEN = ""
$EnvState.SRH_CONNECTION_STRING = ""
$EnvState.UPSTASH_REDIS_REST_URL = ""
$EnvState.UPSTASH_REDIS_REST_TOKEN = ""
$EnvState.EMAIL = ""
#endregion

#region Pre-Flight Checks
if (-not (Test-Path $ExamplePath)) {
  Write-Host "[!] .env.example missing. Creating default..." -ForegroundColor Yellow
  $DefaultTemplate = "ENV_MODE=srh`nSRH_TOKEN=`nSRH_CONNECTION_STRING=`nEMAIL=`nUPSTASH_REDIS_REST_URL=`nUPSTASH_REDIS_REST_TOKEN="
    
  # Write initial example without BOM
  $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllLines((New-Item -Path $ExamplePath -Force).FullName, $DefaultTemplate, $Utf8NoBom)
}

if (Test-Path $LocalPath) {
  [String]$Overwrite = Read-Host ".env.local exists. Overwrite? (y/N)"
  if ($Overwrite -ne 'y') { exit 0 }
}
#endregion

#region User Input
$EnvState.ENV_MODE = (Read-Host "Choose ENV_MODE (srh/upstash) [srh]").ToLower()
if ([string]::IsNullOrWhiteSpace($EnvState.ENV_MODE)) { $EnvState.ENV_MODE = "srh" }

if ($EnvState.ENV_MODE -eq 'upstash') {
  $EnvState.UPSTASH_REDIS_REST_URL = Read-Host "Enter UPSTASH_REDIS_REST_URL"
  $EnvState.UPSTASH_REDIS_REST_TOKEN = Read-Host "Enter UPSTASH_REDIS_REST_TOKEN"
}
else {
  $EnvState.SRH_TOKEN = Read-Host "Enter SRH_TOKEN"
  $EnvState.SRH_CONNECTION_STRING = Read-Host "Enter SRH_CONNECTION_STRING"
}

$EnvState.EMAIL = Read-Host "Enter EMAIL"
#endregion

#region File Generation
# Read the file and explicitly strip the BOM if it exists in the source
[String]$RawContent = Get-Content $ExamplePath -Raw
$CleanContent = $RawContent -replace "^\uFEFF", ""
[String[]]$Lines = $CleanContent -split '\r?\n'

[String[]]$NewContent = $Lines | ForEach-Object {
  $Line = $_
  if ($Line -match '^([^=]+)=(.*)$') {
    $Key = $Matches[1].Trim()
    if ($EnvState.ContainsKey($Key) -and -not [string]::IsNullOrWhiteSpace($EnvState[$Key])) {
      "$Key=$($EnvState[$Key])"
    } 
    elseif ($Key -eq "VITE_EMAIL" -and -not [string]::IsNullOrWhiteSpace($EnvState.EMAIL)) {
      "VITE_EMAIL=$($EnvState.EMAIL)"
    }
    else { $Line }
  }
  else { $Line }
}

if (-not ($NewContent -match "^VITE_EMAIL=") -and -not [string]::IsNullOrWhiteSpace($EnvState.EMAIL)) {
  $NewContent += "VITE_EMAIL=$($EnvState.EMAIL)"
}

$AbsolutePath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($LocalPath)
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($AbsolutePath, $NewContent, $Utf8NoBom)
#endregion

Write-Host "`n[+] .env.local generated (UTF-8 No BOM)." -ForegroundColor Green