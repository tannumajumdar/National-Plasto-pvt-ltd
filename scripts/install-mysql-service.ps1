<#
    Registers Laragon's bundled MySQL as a Windows service, so the National
    Plasto database survives a reboot instead of having to be started by hand.

    RUN THIS AS ADMINISTRATOR — installing a service needs elevation.

        Right-click  ->  "Run with PowerShell"   (accept the UAC prompt)

    or from an elevated PowerShell window:

        powershell -ExecutionPolicy Bypass -File "scripts\install-mysql-service.ps1"

    To undo everything:

        powershell -ExecutionPolicy Bypass -File "scripts\install-mysql-service.ps1" -Uninstall
#>

param(
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

$ServiceName = 'NationalPlastoMySQL'
$MysqlHome   = 'C:\laragon\bin\mysql\mysql-8.4.3-winx64'
$Mysqld      = Join-Path $MysqlHome 'bin\mysqld.exe'
$DefaultsIni = Join-Path $MysqlHome 'my.ini'

function Assert-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($id)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host ''
        Write-Host '  This script must run as Administrator.' -ForegroundColor Red
        Write-Host '  Right-click it and choose "Run with PowerShell", or open an' -ForegroundColor Red
        Write-Host '  elevated PowerShell window and run it again.' -ForegroundColor Red
        Write-Host ''
        exit 1
    }
}

function Get-MysqlService {
    Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
}

Assert-Admin

# ---------------------------------------------------------------- uninstall
if ($Uninstall) {
    $svc = Get-MysqlService
    if (-not $svc) {
        Write-Host "  Service '$ServiceName' is not installed. Nothing to do." -ForegroundColor Yellow
        exit 0
    }

    if ($svc.Status -ne 'Stopped') {
        Write-Host "  Stopping $ServiceName ..."
        Stop-Service -Name $ServiceName -Force
        (Get-MysqlService).WaitForStatus('Stopped', '00:00:30')
    }

    Write-Host "  Removing the service ..."
    & $Mysqld --remove $ServiceName | Out-Null
    Start-Sleep -Seconds 2

    if (Get-MysqlService) {
        # mysqld --remove can leave the entry behind if a handle is still open.
        & sc.exe delete $ServiceName | Out-Null
        Start-Sleep -Seconds 2
    }

    Write-Host ''
    Write-Host "  Done. '$ServiceName' has been removed." -ForegroundColor Green
    Write-Host "  MySQL now has to be started by hand again." -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# ---------------------------------------------------------------- checks
Write-Host ''
Write-Host '  National Plasto - MySQL service installer' -ForegroundColor Cyan
Write-Host ('  ' + ('-' * 44))

foreach ($path in @($Mysqld, $DefaultsIni)) {
    if (-not (Test-Path $path)) {
        Write-Host "  Missing: $path" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  mysqld   : $Mysqld"
Write-Host "  config   : $DefaultsIni"

& $Mysqld --defaults-file="$DefaultsIni" --validate-config
if ($LASTEXITCODE -ne 0) {
    Write-Host '  The config file was rejected by mysqld. Stopping.' -ForegroundColor Red
    exit 1
}
Write-Host '  config validated OK' -ForegroundColor Green

if (Get-MysqlService) {
    Write-Host ''
    Write-Host "  Service '$ServiceName' already exists." -ForegroundColor Yellow
    Write-Host "  Re-run with -Uninstall first if you want to recreate it."
    Write-Host ''
    exit 0
}

# ------------------------------------------------- free the port first
# A hand-started mysqld is almost certainly holding 3306; the service cannot
# bind it while that process is alive.
$running = Get-Process -Name 'mysqld' -ErrorAction SilentlyContinue
if ($running) {
    Write-Host ''
    Write-Host "  Stopping $($running.Count) hand-started mysqld process(es) so the" -ForegroundColor Yellow
    Write-Host '  service can take over port 3306 ...' -ForegroundColor Yellow
    # Ask politely first: a clean shutdown flushes InnoDB rather than relying
    # on crash recovery at next start.
    $admin = Join-Path $MysqlHome 'bin\mysqladmin.exe'
    if (Test-Path $admin) {
        & $admin -u root --protocol=TCP -h 127.0.0.1 -P 3306 shutdown 2>$null
        Start-Sleep -Seconds 5
    }
    Get-Process -Name 'mysqld' -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 3
}

# ---------------------------------------------------------------- install
Write-Host ''
Write-Host "  Installing service '$ServiceName' ..."
& $Mysqld --install $ServiceName --defaults-file="$DefaultsIni"
if ($LASTEXITCODE -ne 0) {
    Write-Host '  mysqld --install failed.' -ForegroundColor Red
    exit 1
}
Start-Sleep -Seconds 2

& sc.exe config $ServiceName start= auto | Out-Null
& sc.exe description $ServiceName 'MySQL 8.4 for the National Plasto e-commerce site.' | Out-Null

Write-Host "  Starting it ..."
Start-Service -Name $ServiceName
(Get-MysqlService).WaitForStatus('Running', '00:01:00')

# ---------------------------------------------------------------- verify
$svc = Get-MysqlService
Write-Host ''
Write-Host "  Service  : $($svc.Name)"
Write-Host "  Status   : $($svc.Status)"
Write-Host "  Start    : $((Get-CimInstance Win32_Service -Filter "Name='$ServiceName'").StartMode)"

$mysql = Join-Path $MysqlHome 'bin\mysql.exe'
& $mysql -u root --protocol=TCP -h 127.0.0.1 -P 3306 national_plasto -e "SELECT VERSION() AS mysql, DATABASE() AS db;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host ''
    Write-Host '  Connected. MySQL will now start automatically on boot.' -ForegroundColor Green
} else {
    Write-Host ''
    Write-Host '  The service is running but the test query failed.' -ForegroundColor Yellow
    Write-Host '  Check the error log at:' -ForegroundColor Yellow
    Write-Host "    $MysqlHome\data\$env:COMPUTERNAME.err"
}
Write-Host ''
