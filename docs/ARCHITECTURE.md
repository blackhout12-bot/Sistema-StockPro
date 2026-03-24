# Arquitectura General (TB Gestión ERP)

Este documento funge como el *Single Source of Truth* (SSOT) del diseño del sistema. El ecosistema es un Monolito Distribuido Multi-Tenant, regido orgánicamente por Express en Node.js, y servido globalmente a través de un Frontend encapsulado en Vite/React.

## Principios Multi-Tenant y Seguridad (RBAC)
Cada sucursal (Contexto) se aísla de las otras en una topología M:N, garantizando que el usuario solo opere en las franquicias a las que se le haya delegado el poder.

### Delegación Organizacional Temporal
Implementada en `v1.23.0`, esta tecnología permite a los perfiles Directivos traspasar un sub-rol (Ej: de Administrador a Supervisor Temporal) a cualquier usuario mediante la tabla puente.

```mermaid
erDiagram
    USUARIOS {
        int id PK
        varchar rol
        varchar email
    }
    CONTEXTOS {
        int id PK
        varchar nombre_sucursal
    }
    CONTEXTOS_USUARIOS {
        int usuario_id FK
        int contexto_id FK
    }
    DELEGACIONES {
        int id PK
        int delegante_id FK
        int delegado_id FK
        varchar rol_asignado
        datetime fecha_inicio
        datetime fecha_fin "Nullable (Perm)"
    }

    USUARIOS ||--o{ CONTEXTOS_USUARIOS : "se correlaciona"
    CONTEXTOS ||--o{ CONTEXTOS_USUARIOS : "alberga"
    USUARIOS ||--o{ DELEGACIONES : "presta poder"
    USUARIOS ||--o{ DELEGACIONES : "recibe poder"
```

## Despliegue del Clúster y Balanceo (Escalabilidad)
Para amortizar las cargas en `v1.22.0`, la topología migró a orquestación de Kubernetes.

```mermaid
flowchart TD
    Internet([Red Externa]) --> Ingress[Ingress Controller NGINX]
    Ingress -- HTTP/2 --> FE[Frontend Pods: React Vite]
    Ingress -- TLS/REST --> LB[Load Balancer Interno Service]
    
    LB --> NodeEx1[Node.js Express Replicaset 1]
    LB --> NodeEx2[Node.js Express Replicaset 2]
    LB --> NodeExN[Node.js ...N]
    
    NodeEx1 --> MSSQL[(Base de Datos SQL Server)]
    NodeEx2 --> MSSQL
    NodeExN --> MSSQL
```

La red maneja protección *OOM-Kill* limitando de manera estricta los ciclos de reloj de la CPU y la asignación nativa de la Memoria RAM. En caso de fallos por picos de facturación, K8s instanciará clústeres elásticos mediante *Horizontal Pod Autoscaler (HPA)*.
