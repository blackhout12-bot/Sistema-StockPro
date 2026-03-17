#!/bin/bash
# deploy.sh - Script de Despliegue para StockPro con Auditoría

NAMESPACE="stock-system"
RELEASE_NAME="stock-system"
CHART_DIR="./k8s/charts/stock-system"

echo "=========================================="
echo "    Iniciando Despliegue a Producción    "
echo "=========================================="

if ! command -v helm &> /dev/null; then
    echo "Error: Helm no está instalado. Instalación requerida."
    exit 1
fi

echo "[Paso 1] Auditoría Pre-Despliegue..."
if [ -f "./audit.sh" ]; then
    chmod +x ./audit.sh
    ./audit.sh
    if [ $? -ne 0 ]; then
        echo "❌ La auditoría pre-despliegue falló. Abortando despliegue."
        exit 1
    fi
else
    echo "⚠️ audit.sh no encontrado, saltando auditoría local pre-despliegue."
fi

echo "[Paso 2] Desplegando aplicación con Helm..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install $RELEASE_NAME $CHART_DIR \
    --namespace $NAMESPACE \
    --atomic --timeout 10m

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✅ Despliegue completado exitosamente.   "
    echo "=========================================="
else
    echo "❌ Fallo crítico durante el despliegue."
    echo "Iniciando Rollback automático..."
    if [ -f "./rollback.sh" ]; then
        chmod +x ./rollback.sh
        ./rollback.sh
    else
        echo "Error: No se encontró rollback.sh."
    fi
    exit 1
fi

exit 0
