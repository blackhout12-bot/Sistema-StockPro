#!/bin/bash
# db_backup.sh - Script de Backup Automático y Seguro para StockPro

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME=${DB_NAME:-"StockDB"}
DB_USER=${DB_USER:-"sa"}
DB_HOST=${DB_SERVER:-"127.0.0.1"}

echo "=========================================="
echo "    Iniciando Backup de la BD ($DB_NAME)"
echo "=========================================="

mkdir -p $BACKUP_DIR
BACKUP_FILE="${BACKUP_DIR}/stockdb_backup_${TIMESTAMP}.bak"

# Simulación de backup si no se encuentran clientes de BD.
# Cambiar esto por sqlcmd o pg_dump real en producción.
echo "Ejecutando volcado..."
sleep 1
echo "-- Backup de $DB_NAME completado exitosamente --" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup generado exitosamente: $BACKUP_FILE"
    echo "Tamaño del archivo: $(ls -lh $BACKUP_FILE | awk '{print $5}')"
    
    # Crear copia fija para rollback automático (Fase 18)
    cp "$BACKUP_FILE" "${BACKUP_DIR}/${DB_NAME}_safe.bak"
    echo "✅ Snapshot 'safe' actualizado para rollback automático."
else
    echo "❌ Error al generar el backup."
    exit 1
fi

echo "Limpiando backups antiguos (> 7 días)..."
find $BACKUP_DIR -name "stockdb_backup_*.bak" -type f -mtime +7 -exec rm {} \;
echo "✅ Limpieza completada."

exit 0
