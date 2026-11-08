# ISKO kiosk launcher. Opens ISKO fullscreen (Edge or Chrome kiosk mode) with silent printing.
#   (no switch)         launch the kiosk once
#   -KeepAlive          relaunch automatically if the browser is closed or crashes
#   -InstallAutostart   start the kiosk (with -KeepAlive) every time this Windows user signs in
#   -RemoveAutostart    undo -InstallAutostart
#   -Stop               staff only: stop the kiosk and its watchdog
param([switch]$KeepAlive, [switch]$InstallAutostart, [switch]$RemoveAutostart, [switch]$Stop)
$ErrorActionPreference = 'Stop'
$appFolder = $PSScriptRoot
$appFile   = Join-Path $appFolder 'index.html'
$dataDir   = Join-Path $env:LOCALAPPDATA 'ISKO-Kiosk'
$profile   = Join-Path $dataDir 'browser-profile'
$stopFlag  = Join-Path $dataDir 'stop.flag'
$startup   = Join-Path ([Environment]::GetFolderPath('Startup')) 'ISKO Kiosk.lnk'
$shell     = New-Object -ComObject WScript.Shell
function Notify($text, $icon = 64) { $shell.Popup($text, 6, 'ISKO Kiosk', $icon) | Out-Null }
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

if ($InstallAutostart) {
    $link = $shell.CreateShortcut($startup)
    $link.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $link.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $appFolder 'Launch-ISKO-Kiosk.ps1') + '" -KeepAlive'
    $link.WorkingDirectory = $appFolder
    $link.IconLocation = Join-Path $appFolder 'assets\isko.ico'
    $link.Save()
    Notify 'ISKO Kiosk will now start automatically when this user signs in to Windows.'
    exit
}
if ($RemoveAutostart) {
    if (Test-Path -LiteralPath $startup) { Remove-Item -LiteralPath $startup -Force }
    Notify 'ISKO Kiosk will no longer start automatically.'
    exit
}
if ($Stop) {
    Set-Content -LiteralPath $stopFlag -Value 'stop'
    Get-CimInstance Win32_Process |
        Where-Object { $_.CommandLine -and $_.CommandLine -like '*ISKO-Kiosk*browser-profile*' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Notify 'ISKO Kiosk stopped.'
    exit
}

if (-not (Test-Path -LiteralPath $appFile)) { Notify 'ISKO could not find index.html. Keep all app files together in one folder.' 48; exit 1 }
$candidates = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$browser = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browser) { Notify 'Microsoft Edge or Google Chrome is required to run the ISKO kiosk.' 48; exit 1 }

$uri = ([System.Uri]::new($appFile)).AbsoluteUri
$flags = @(
    '--kiosk', "`"$uri`"",
    '--kiosk-printing',                       # print without the dialog (uses the Windows default printer)
    "`"--user-data-dir=$profile`"",
    '--no-first-run', '--no-default-browser-check',
    '--noerrdialogs', '--disable-infobars', '--disable-session-crashed-bubble',
    '--disable-pinch', '--overscroll-history-navigation=0',
    '--disable-features=Translate,TranslateUI',
    '--check-for-update-interval=31536000'
)
if ($browser -like '*msedge.exe') { $flags += '--edge-kiosk-type=fullscreen' }

Remove-Item -LiteralPath $stopFlag -Force -ErrorAction SilentlyContinue
do {
    $process = Start-Process -FilePath $browser -ArgumentList ($flags -join ' ') -PassThru
    if (-not $KeepAlive) { break }
    Start-Sleep -Seconds 5                    # Edge/Chrome may hand off to another process; wait for the profile to go idle
    while (Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like '*ISKO-Kiosk*browser-profile*' }) { Start-Sleep -Seconds 3 }
    if (Test-Path -LiteralPath $stopFlag) { break }
    Start-Sleep -Seconds 2
} while ($true)
