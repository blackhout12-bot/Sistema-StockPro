const searchRepository = require('./search.repository');

class SearchService {
    async performGlobalSearch(query, empresa_id, userRole) {
        // En base a los roles, decidimos si buscamos en Facturas, Clientes, etc.
        const isAdminOrGerente = userRole === 'admin' || userRole === 'gerente';
        const isCajero = userRole === 'cajero';
        const isSupervisor = userRole === 'supervisor';

        // Por ahora, todos pueden buscar productos y clientes.
        // Facturas: admin, gerente, supervisor, cajero.
        // Proveedores: admin, gerente, supervisor.

        const fetchFacturas = true; // cajero también puede ver tickets
        const fetchProveedores = isAdminOrGerente || isSupervisor;

        const results = await searchRepository.globalSearch(
            query, 
            empresa_id, 
            { fetchFacturas, fetchProveedores }
        );

        // Normalize DTOs
        const normalized = [];

        // Productos
        results.productos.forEach(p => {
            normalized.push({
                id: p.id,
                tipo: 'PRODUCTO',
                nombre: p.nombre,
                extra: `SKU: ${p.sku || 'N/A'} - Stock: ${p.stock}`,
                ruta: '/productos' // La grilla filtrará
            });
        });

        // Facturas
        if (fetchFacturas && results.facturas) {
            results.facturas.forEach(f => {
                normalized.push({
                    id: f.id,
                    tipo: 'FACTURA',
                    nombre: f.nro_factura,
                    extra: `Cliente: ${f.cliente_nombre || 'Consumidor Final'} - Total: $${Number(f.total).toFixed(2)}`,
                    ruta: '/facturacion'
                });
            });
        }

        // Clientes
        results.clientes.forEach(c => {
            normalized.push({
                id: c.id,
                tipo: 'CLIENTE',
                nombre: c.nombre,
                extra: `Doc: ${c.documento_identidad || 'N/A'} - Tel: ${c.telefono || 'N/A'}`,
                ruta: '/clientes'
            });
        });

        // Proveedores
        if (fetchProveedores && results.proveedores) {
            results.proveedores.forEach(prov => {
                normalized.push({
                    id: prov.id,
                    tipo: 'PROVEEDOR',
                    nombre: prov.nombre,
                    extra: `Doc/CUIT: ${prov.documento_identidad || 'N/A'}`,
                    ruta: '/proveedores'
                });
            });
        }

        return normalized;
    }
}

module.exports = new SearchService();
