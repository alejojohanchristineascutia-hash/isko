param([switch]$CreateShortcut)
$ErrorActionPreference = 'Stop'
$appFolder = $PSScriptRoot
$appFile = Join-Path $appFolder 'index.html'
if ($CreateShortcut) {
    $shortcutShell = New-Object -ComObject WScript.Shell
    $shortcut = $shortcutShell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'ISKO - Student Documents.lnk'))
    $shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $appFolder 'Launch-ISKO.ps1') + '"'
    $shortcut.WorkingDirectory = $appFolder
    $shortcut.Description = 'ISKO - Student document request app'
    $shortcut.IconLocation = Join-Path $appFolder 'assets\isko.ico'
    $shortcut.Save()
    $shortcutShell.Popup('Your ISKO shortcut is ready on the Desktop.', 5, 'ISKO', 64) | Out-Null
    exit
}
if (-not (Test-Path -LiteralPath $appFile)) {
    (New-Object -ComObject WScript.Shell).Popup('ISKO could not find index.html. Keep all the app files together in the same folder.', 0, 'ISKO', 48) | Out-Null
    exit 1
}
$appUri = ([System.Uri]::new($appFile)).AbsoluteUri
$browserPaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$browser = $browserPaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if ($browser) {
    Start-Process -FilePath $browser -ArgumentList @("--app=$appUri", '--window-size=1440,960') -WindowStyle Normal
} else {
    Start-Process -FilePath $appFile
}
