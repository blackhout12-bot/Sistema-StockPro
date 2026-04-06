# scripts/db_backup.ps1
# Script de Resiliencia: Backup Físico de StockDB (Windows)

$database = $env:DB_NAME -if ($null -eq $env:DB_NAME) { "StockDB" }
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $PSScriptRoot "..\backups"
$backupFile = Join-Path $backupDir "$($database)_$timestamp.bak"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Iniciando Backup Físico: $database"
Write-Host "==========================================" -ForegroundColor Cyan

$sqlCommand = "BACKUP DATABASE [$database] TO DISK = '$backupFile' WITH FORMAT, MEDIANAME = 'StockDB_Backup', NAME = 'Full Backup of $database';"

try {
    # Ejecutar vía sqlcmd (requiere permisos de sysadmin o db_backupoperator)
    sqlcmd -S "." -Q $sqlCommand -E
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup completado exitosamente: $backupFile" -ForegroundColor Green
        # Crear copia 'safe' para rollback automático
        $safeFile = Join-Path $backupDir "$($database)_safe.bak"
        Copy-Item $backupFile $safeFile -Force
        Write-Host "✅ Snapshot 'safe' actualizado para rollback." -ForegroundColor Green
    } else {
        throw "sqlcmd falló con código de salida $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Error crítico realizando backup: $_" -ForegroundColor Red
    exit 1
}

exit 0
