// src/modules/marketplace/marketplace.controller.js
const { connectDB } = require('../../config/db');
const sql = require('mssql');

// Módulos disponibles en el ecosistema (mock/semi-estático para el ejemplo)
const MODULOS_DISPONIBLES = [
    { id: 'MOD-FARMACIA', nombre: 'Módulo Farmacia', versionApi: '2.0', descripcion: 'Gestión de lotes, recetas y trazabilidad de medicamentos.', icono: 'Cross' },
    { id: 'MOD-RESTAURANT', nombre: 'Módulo Restaurante', versionApi: '2.0', descripcion: 'Comandas, mesas y control de ingredientes por receta.', icono: 'Utensils' },
    { id: 'MOD-ECOMMERCE', nombre: 'Integración E-Commerce', versionApi: '2.0', descripcion: 'Sincronización bidireccional de stock con Shopify y WooCommerce.', icono: 'ShoppingCart' },
    { id: 'MOD-INDUMENTARIA', nombre: 'Módulo Indumentaria', versionApi: '2.0', descripcion: 'Gestión por talle y color. Catálogos visuales.', icono: 'Shirt' }
];

class MarketplaceController {
    
    // Obtener catálogo de módulos y estado de instalación
    async getModules(req, res, next) {
        try {
            const pool = await connectDB();
            
            // Simular tabla EmpresaModulos (Auditoría de instalación)
            // Si la tabla no existe físicamente, simulamos basándonos en metadata u omisión para no romper.
            // Aqui consultaremos una tabla mockeada si es posible, pero usaremos un try-catch silencioso.
            let instalados = [];
            const resModulos = await pool.request()
                .input('empresa_id', sql.Int, req.tenant_id)
                .query('SELECT modulo_id, fecha_instalacion, estado FROM EmpresaModulos WHERE empresa_id = @empresa_id');
            instalados = resModulos.recordset;

            const catalogo = MODULOS_DISPONIBLES.map(mod => {
                const match = instalados.find(i => i.modulo_id === mod.id);
                return {
                    ...mod,
                    instalado: !!match,
                    fecha_instalacion: match ? match.fecha_instalacion : null
                };
            });

            res.json(catalogo);
        } catch (error) {
            next(error);
        }
    }

    // Instalar módulo (Auditoría Inmutable)
    async installModule(req, res, next) {
        try {
            const { modulo_id } = req.body;
            const modulo = MODULOS_DISPONIBLES.find(m => m.id === modulo_id);
            
            if (!modulo) return res.status(404).json({ error: 'Módulo no encontrado' });

            const pool = await connectDB();
            
            // Auditoría inmutable intentando insertar en la tabla EmpresaModulos
            await pool.request()
                .input('empresa_id', sql.Int, req.tenant_id)
                .input('modulo_id', sql.VarChar(50), modulo_id)
                .input('usuario_id', sql.Int, req.user.id)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM EmpresaModulos WHERE empresa_id = @empresa_id AND modulo_id = @modulo_id)
                    BEGIN
                        INSERT INTO EmpresaModulos (empresa_id, modulo_id, usuario_id_instalador, fecha_instalacion, estado) 
                        VALUES (@empresa_id, @modulo_id, @usuario_id, GETDATE(), 'ACTIVO')
                    END
                `);

            try {
                const { notifyEvent } = require('../../utils/webhook.service');
                await notifyEvent(req.tenant_id, 'marketplace.module.installed', {
                    modulo_id,
                    usuario_id: req.user.id,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {
                console.error('Error firing marketplace webhook', e);
            }

            res.json({ message: `Módulo ${modulo.nombre} instalado y habilitado exitosamente.`, modulo_id });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MarketplaceController();
