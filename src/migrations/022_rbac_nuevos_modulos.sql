-- Migración 022: Añadir permisos de nuevos módulos a roles existentes
-- Autoriza el uso de Proveedores, Compras, Cuentas Pagar/Cobrar y Kardex

-- 1. Actualizar roles 'gerente' en todas las empresas para añadir los módulos nuevos
UPDATE Roles
SET permisos = JSON_MODIFY(
    JSON_MODIFY(
        JSON_MODIFY(
            JSON_MODIFY(
                JSON_MODIFY(permisos, '$.proveedores', JSON_QUERY('["leer","crear","actualizar","exportar"]')),
                '$.compras', JSON_QUERY('["leer","crear","exportar"]')
            ),
            '$.cuentas_pagar', JSON_QUERY('["leer","crear","actualizar","exportar"]')
        ),
        '$.cuentas_cobrar', JSON_QUERY('["leer","crear","actualizar","exportar"]')
    ),
    '$.kardex', JSON_QUERY('["leer","exportar"]')
)
WHERE codigo_rol = 'gerente' AND ISJSON(permisos) = 1;

-- 2. Actualizar roles 'cajero' para permitir visualizar clientes y registrar cobros en cuentas por cobrar
UPDATE Roles
SET permisos = JSON_MODIFY(
    JSON_MODIFY(permisos, '$.cuentas_cobrar', JSON_QUERY('["leer","crear"]')),
    '$.clientes', JSON_QUERY('["leer"]')
)
WHERE codigo_rol = 'cajero' AND ISJSON(permisos) = 1;

-- 3. Los roles 'admin' ya tienen '{"*": [...]}' por lo que heredan automáticamente el acceso, pero por si acaso hay admins con roles explícitos:
UPDATE Roles
SET permisos = JSON_MODIFY(
    JSON_MODIFY(
        JSON_MODIFY(
            JSON_MODIFY(
                JSON_MODIFY(permisos, '$.proveedores', JSON_QUERY('["leer","crear","actualizar","eliminar","exportar"]')),
                '$.compras', JSON_QUERY('["leer","crear","exportar"]')
            ),
            '$.cuentas_pagar', JSON_QUERY('["leer","crear","actualizar","exportar"]')
        ),
        '$.cuentas_cobrar', JSON_QUERY('["leer","crear","actualizar","exportar"]')
    ),
    '$.kardex', JSON_QUERY('["leer","exportar"]')
)
WHERE codigo_rol = 'admin' AND ISJSON(permisos) = 1 AND JSON_VALUE(permisos, '$."*"') IS NULL;

PRINT 'Permisos de los módulos corporativos (Proveedores, Compras, Cuentas, Kardex) inyectados con éxito en la matriz RBAC JSON.';
