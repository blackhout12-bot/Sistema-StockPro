# Manual de Despliegue Reproducible (SRE)

Para certificar y validar cualquier módulo del ERP en Sandbox, se dictaminan los presentes comandos de *Containerización* y *Orquestación*, evadiendo las divergencias de sistema operativo (Es un enfoque 100% *Ops-Driven*).

## Opción 1: Docker-Compose Local (Staging Ligero)

Esta variante levanta las imágenes en *localhost* con una base de datos efímera SQL Server (Linux/Ubuntu Container).

1. Mapear el `docker-compose.yml` en la raíz (incluyendo Secretos de variables de entorno ficticios):
```bash
docker build -t tb-gestion-backend ./src
docker build -t tb-gestion-frontend ./frontend
docker-compose up -d --build
```

2. Validar que el FrontEnd escucha peticiones HTTP transparentes:
```bash
curl -I http://localhost:80
```

## Opción 2: Kubernetes + Helm (Multi-Nodo / Producción Real)

Despliegue multi-clúster que engloba Ingress Nginx, Controladores Liveness/Readiness y protecciones auto-sanitarias (OOM_Kills limits).

1. Establecer contexto e inyectar *Secrets* crudos:
```bash
kubectl config use-context produccion-tb-gestion
kubectl create secret generic mssql-db-credentials --from-literal=password="UltraSecret#123"
```

2. Embolsar el *Helm Chart* de infraestructura:
```bash
helm upgrade --install tb-erp-release ./charts/tb_erp_chart \
  --namespace tb-produccion --create-namespace \
  --set limits.cpu=500m \
  --set limits.memory=512Mi
```

3. Verificar Logs elásticos al vuelo e interceptar CrashLoops del balanceador de cargas interno:
```bash
kubectl get pods -n tb-produccion -w
kubectl logs deployment/tb-erp-backend -n tb-produccion -f --tail=200
```

### Protocolo de Rollback Automático o Manual
En el desgraciado evento en el que un despliegue quiebre las validaciones post-hook del pipeline CI, el rollback se despacharía automáticamente por GitHub Actions. Para una involución manual:
```bash
helm history tb-erp-release -n tb-produccion
helm rollback tb-erp-release 1 -n tb-produccion
```
