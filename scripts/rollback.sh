#!/bin/bash
# scripts/rollback.sh
# ─── TB Gestión ERP: Script de Reversión Maestro (v1.20.0) ───
# Permite retroceder atómicamente a la versión previa tras un fallo en pruebas de humo o auditoría.

set -e

echo "⚠️ INICIANDO ROLLBACK AUTOMÁTICO DE EMERGENCIA..."
DATE=$(date +'%Y-%m-%d %H:%M:%S')

# 1. Determinar el entorno de despliegue (Helm / K8s vs Docker Compose)
if command -v helm &> /dev/null && helm status stock-system -n stock-system &> /dev/null; then
    echo "[$DATE] Detectado clúster K8s con Helm. Reversión de la Release 'stock-system'..."
    
    # Intenta obtener la release anterior
    PREV_REVISION=$(helm history stock-system -n stock-system --max 2 | tail -n 1 | awk '{print $1}')
    
    if [ -n "$PREV_REVISION" ]; then
        if helm rollback stock-system 0 -n stock-system --wait --timeout 15m; then
            echo "✅ [$DATE] Helm Rollback completado exitosamente a la última versión estable."
        else
            echo "❌ [$DATE] FALLO CRÍTICO: No se pudo realizar el rollback de Helm. Intervención manual requerida."
            exit 1
        fi
    else
        echo "❌ [$DATE] No hay un historial previo para hacer rollback en Helm."
        exit 1
    fi
    
elif command -v docker-compose &> /dev/null; then
    echo "[$DATE] Despliegue en Docker Compose detectado."
    echo "🔄 Deteniendo contenedores actuales..."
    docker-compose down

    echo "⏪ Reiniciando con las imágenes parcheadas previas..."
    # Asume que un tag :stable fue tageado en el backup post-despliegue
    export APP_VERSION=stable
    docker-compose up -d
    echo "✅ [$DATE] Docker Compose rollback completado."
else
    echo "❌ [$DATE] No se encontró gestor de contenedores válido (Helm/Kubernetes o Docker Compose)."
    exit 1
fi

echo "====================================================="
echo "🆘 AVISO AL EQUIPO SR: Rollback completado."
echo "La infraestructura ha regresado al estado de seguridad validado."
echo "Por favor asigne un técnico a revisar los logs del pipeline fallido."
echo "====================================================="
exit 0
