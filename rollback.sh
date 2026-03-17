#!/bin/bash
# rollback.sh - Script de Rollback Automático para StockPro

NAMESPACE="stock-system"
RELEASE_NAME="stock-system"

echo "=========================================="
echo "    Iniciando Rollback Automático        "
echo "=========================================="

echo "Verificando el historial de Helm para el release: $RELEASE_NAME en el namespace $NAMESPACE..."

if ! command -v helm &> /dev/null; then
    echo "Error: Helm no está instalado."
    exit 1
fi

# Obtener historial y buscar la revisión anterior que fue "deployed" con éxito
PREVIOUS_REVISION=$(helm history $RELEASE_NAME -n $NAMESPACE -o json | jq -r 'map(select(.status == "deployed")) | sort_by(.revision) | .[-2].revision')

if [ -z "$PREVIOUS_REVISION" ] || [ "$PREVIOUS_REVISION" == "null" ]; then
    echo "No se encontró una revisión exitosa anterior para hacer rollback."
    echo "Revisión actual es posiblemente la única o todas fallaron."
    exit 1
fi

echo "Se encontró la revisión exitosa anterior: $PREVIOUS_REVISION"
echo "Ejecutando Helm Rollback..."

helm rollback $RELEASE_NAME $PREVIOUS_REVISION -n $NAMESPACE --wait --timeout 5m

if [ $? -eq 0 ]; then
    echo "Rollback completado exitosamente a la revisión $PREVIOUS_REVISION."
    exit 0
else
    echo "Fallo crítico durante el rollback."
    exit 1
fi
