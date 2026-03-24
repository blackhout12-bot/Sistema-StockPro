// src/modules/empresa/empresa.model.js
const sql = require('mssql');

class EmpresaModel {

    async getEmpresa(pool, empresa_id) {
        const result = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query('SELECT * FROM Empresa WHERE id = @empresa_id');
        return result.recordset[0] || null;
    }

    async updateEmpresa(pool, empresaData) {
        const {
            id,
            nombre, documento_identidad, direccion, telefono, email,
            sitio_web, pais, ciudad, codigo_postal, logo_url, rubro
        } = empresaData;

        // Self-healing: verificar si la columna rubro existe
        const hasRubro = await pool.request().query(
            "SELECT COUNT(*) as cnt FROM sys.columns " +
            "WHERE object_id = OBJECT_ID('Empresa') AND name = 'rubro'"
        ).then(r => r.recordset[0]?.cnt > 0).catch(() => false);

        const req = pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.NVarChar(255), nombre || null)
            .input('documento_identidad', sql.NVarChar(100), documento_identidad || null)
            .input('direccion', sql.NVarChar(500), direccion || null)
            .input('telefono', sql.NVarChar(50), telefono || null)
            .input('email', sql.NVarChar(255), email || null)
            .input('sitio_web', sql.NVarChar(255), sitio_web || null)
            .input('pais', sql.NVarChar(100), pais || null)
            .input('ciudad', sql.NVarChar(100), ciudad || null)
            .input('codigo_postal', sql.NVarChar(20), codigo_postal || null)
            .input('logo_url', sql.NVarChar(500), logo_url || null);

        if (hasRubro) req.input('rubro', sql.NVarChar(50), rubro || 'general');

        await req.query(`
            UPDATE Empresa SET
                nombre               = @nombre,
                documento_identidad  = @documento_identidad,
                direccion            = @direccion,
                telefono             = @telefono,
                email                = @email,
                sitio_web            = @sitio_web,
                pais                 = @pais,
                ciudad               = @ciudad,
                codigo_postal        = @codigo_postal,
                logo_url             = @logo_url
                ${hasRubro ? ', rubro = @rubro' : ''}
            WHERE id = @id
        `);
        return this.getEmpresa(pool, id);
    }

    async updateConfiguracion(pool, empresa_id, config) {
        const { moneda_base_id, zona_horaria, regional_formato_fecha, regional_formato_hora, regional_separador_decimal, idioma } = config;
        await pool.request()
            .input('id', sql.Int, empresa_id)
            .input('moneda_base', sql.NVarChar(3), moneda_base_id || 'ARS')
            .input('zona_horaria', sql.NVarChar(100), zona_horaria || 'America/Argentina/Buenos_Aires')
            .input('formato_fecha', sql.NVarChar(20), regional_formato_fecha || 'DD/MM/YYYY')
            .input('formato_hora', sql.NVarChar(20), regional_formato_hora || '24h')
            .input('separador_decimal', sql.NVarChar(1), regional_separador_decimal || '.')
            .input('idioma', sql.NVarChar(10), idioma || 'es-AR')
            .query(`
                UPDATE Empresa SET
                    moneda_base_id             = @moneda_base,
                    zona_horaria               = @zona_horaria,
                    regional_formato_fecha     = @formato_fecha,
                    regional_formato_hora      = @formato_hora,
                    regional_separador_decimal = @separador_decimal,
                    regional_idioma            = @idioma
                WHERE id = @id
            `);
        return this.getEmpresa(pool, empresa_id);
    }

    async updateBranding(pool, empresa_id, branding) {
        const { color_primario, color_secundario, eslogan, logo_url, nombre_fantasia } = branding;
        await pool.request()
            .input('id', sql.Int, empresa_id)
            .input('p', sql.NVarChar(7), color_primario || '#3b82f6')
            .input('s', sql.NVarChar(7), color_secundario || '#1e40af')
            .input('e', sql.NVarChar(255), eslogan || null)
            .input('l', sql.NVarChar(500), logo_url || null)
            .input('nf', sql.NVarChar(255), nombre_fantasia || null)
            .query(`
                UPDATE Empresa SET
                    branding_color_primario   = @p,
                    branding_color_secundario = @s,
                    branding_eslogan          = @e,
                    logo_url                  = @l,
                    branding_nombre_fantasia  = @nf
                WHERE id = @id
            `);
        return this.getEmpresa(pool, empresa_id);
    }

    async updateInventarioConfig(pool, empresa_id, inv) {
        const { stock_critico, permitir_negativo, stock_max_global, alertas_habilitadas, alertas_canal, control_lotes, control_vencimientos } = inv;
        await pool.request()
            .input('id', sql.Int, empresa_id)
            .input('sc', sql.Int, stock_critico ?? 5)
            .input('pn', sql.Bit, permitir_negativo ? 1 : 0)
            .input('sm', sql.Int, stock_max_global || null)
            .input('ah', sql.Bit, alertas_habilitadas !== false ? 1 : 0)
            .input('ac', sql.NVarChar(50), alertas_canal || 'inapp')
            .input('cl', sql.Bit, control_lotes ? 1 : 0)
            .input('cv', sql.Bit, control_vencimientos ? 1 : 0)
            .query(`
                UPDATE Empresa SET
                    inv_stock_critico_global = @sc,
                    inv_permitir_negativo    = @pn,
                    inv_stock_max_global     = @sm,
                    inv_alertas_habilitadas  = @ah,
                    inv_alertas_canal        = @ac,
                    inv_control_lotes        = @cl,
                    inv_control_vencimientos = @cv
                WHERE id = @id
            `);
        return this.getEmpresa(pool, empresa_id);
    }

    async updateImpuestosConfig(pool, empresa_id, imp) {
        const { iva_defecto, cuit, condicion_fiscal, percepciones_json, retenciones_json } = imp;
        await pool.request()
            .input('id', sql.Int, empresa_id)
            .input('iva', sql.Decimal(5, 2), iva_defecto ?? 21.00)
            .input('cuit', sql.NVarChar(20), cuit || null)
            .input('cf', sql.NVarChar(100), condicion_fiscal || null)
            .input('perc', sql.NVarChar(sql.MAX), percepciones_json || '[]')
            .input('ret', sql.NVarChar(sql.MAX), retenciones_json || '[]')
            .query(`
                UPDATE Empresa SET
                    config_iva_defecto      = @iva,
                    config_cuit_cuil        = @cuit,
                    config_condicion_fiscal = @cf,
                    config_percepciones_json = @perc,
                    config_retenciones_json = @ret
                WHERE id = @id
            `);
        return this.getEmpresa(pool, empresa_id);
    }

    async updateIntegracionesConfig(pool, empresa_id, int) {
        const { 
            email_host, email_port, 
            afip_cuit, afip_punto_venta, afip_tipo_responsable, afip_certificado_path, afip_key_path,
            mercadopago_token, mercadolibre_token, ecommerce_url, ecommerce_secret, erp_key 
        } = int;
        await pool.request()
            .input('id', sql.Int, empresa_id)
            .input('host', sql.NVarChar(255), email_host || null)
            .input('port', sql.Int, email_port || null)
            .input('af_cuit', sql.NVarChar(20), afip_cuit || null)
            .input('af_pv', sql.Int, afip_punto_venta || null)
            .input('af_tr', sql.NVarChar(50), afip_tipo_responsable || null)
            .input('af_cert', sql.NVarChar(1000), afip_certificado_path || null)
            .input('af_key', sql.NVarChar(1000), afip_key_path || null)
            .input('mp', sql.NVarChar(500), mercadopago_token || null)
            .input('meli', sql.NVarChar(500), mercadolibre_token || null)
            .input('eurl', sql.NVarChar(500), ecommerce_url || null)
            .input('esec', sql.NVarChar(500), ecommerce_secret || null)
            .input('ekey', sql.NVarChar(500), erp_key || null)
            .query(`
                UPDATE Empresa SET
                    int_email_host = @host,
                    int_email_port = @port,
                    afip_cuit = @af_cuit,
                    afip_punto_venta = @af_pv,
                    afip_tipo_responsable = @af_tr,
                    afip_certificado_path = @af_cert,
                    afip_key_path = @af_key,
                    int_mercadopago_token = @mp,
                    int_mercadolibre_token = @meli,
                    int_ecommerce_url = @eurl,
                    int_ecommerce_secret = @esec,
                    int_erp_key = @ekey
                WHERE id = @id
            `);
        return this.getEmpresa(pool, empresa_id);
    }

    async updateDashboardConfig(pool, empresa_id, dash) {
        const { kpis_visibles, rango_default, refresco_segundos, widgets_visibles } = dash;
        await pool.request()
            .input('id', sql.Int, empresa_id)
            .input('kpis', sql.NVarChar(sql.MAX), kpis_visibles || '[]')
            .input('rango', sql.NVarChar(50), rango_default || 'mes_actual')
            .input('refresco', sql.Int, refresco_segundos ?? 300)
            .input('widgets', sql.NVarChar(sql.MAX), widgets_visibles || '[]')
            .query(`
                UPDATE Empresa SET
                    dash_kpis_visibles = @kpis,
                    dash_rango_default = @rango,
                    dash_refresco_segundos = @refresco,
                    dash_widgets_visibles = @widgets
                WHERE id = @id
            `);
        return this.getEmpresa(pool, empresa_id);
    }

    async updateFeatureToggles(pool, empresa_id, toggles) {
        await pool.request()
            .input('id', sql.Int, empresa_id)
            .input('tggl', sql.NVarChar(sql.MAX), JSON.stringify(toggles))
            .query(`
                UPDATE Empresa SET
                    feature_toggles = @tggl
                WHERE id = @id
            `);
        return this.getEmpresa(pool, empresa_id);
    }

    // --- Configuración de Comprobantes ---

    async getComprobantes(pool, empresa_id) {
        const result = await pool.request()
            .input('eid', sql.Int, empresa_id)
            .query('SELECT * FROM ConfigComprobantes WHERE empresa_id = @eid AND activo = 1');
        return result.recordset;
    }

    async updateComprobante(pool, empresa_id, comp_id, data) {
        const { tipo_comprobante, prefijo, proximo_nro, activo } = data;
        await pool.request()
            .input('id', sql.Int, comp_id)
            .input('eid', sql.Int, empresa_id)
            .input('tipo', sql.NVarChar(50), tipo_comprobante)
            .input('pre', sql.NVarChar(10), prefijo)
            .input('next', sql.Int, proximo_nro)
            .input('act', sql.Bit, activo ? 1 : 0)
            .query(`
                UPDATE ConfigComprobantes SET
                    tipo_comprobante = @tipo,
                    prefijo          = @pre,
                    proximo_nro      = @next,
                    activo           = @act
                WHERE id = @id AND empresa_id = @eid
            `);
        return true;
    }

    async createComprobante(pool, empresa_id, data) {
        const { tipo_comprobante, prefijo, proximo_nro, activo } = data;
        const result = await pool.request()
            .input('eid', sql.Int, empresa_id)
            .input('tipo', sql.NVarChar(50), tipo_comprobante)
            .input('pre', sql.NVarChar(10), prefijo || '0001')
            .input('next', sql.Int, proximo_nro || 1)
            .input('act', sql.Bit, activo !== false ? 1 : 0)
            .query(`
                INSERT INTO ConfigComprobantes (empresa_id, tipo_comprobante, prefijo, proximo_nro, activo)
                OUTPUT INSERTED.*
                VALUES (@eid, @tipo, @pre, @next, @act)
            `);
        return result.recordset[0];
    }

    async getEstadisticas(pool, empresa_id) {
        // 1. Métricas de operación (columnas garantizadas)
        const r = await pool.request()
            .input('empresa_id', sql.Int, empresa_id)
            .query(`
                WITH ProdStock AS (
                    SELECT p.id, p.precio, ISNULL(SUM(pd.cantidad), 0) AS total_stock
                    FROM Productos p
                    LEFT JOIN ProductoDepositos pd ON pd.producto_id = p.id
                    WHERE p.empresa_id = @empresa_id
                    GROUP BY p.id, p.precio
                )
                SELECT
                    (SELECT COUNT(*) FROM ProdStock) AS total_productos,
                    (SELECT COUNT(*) FROM ProdStock WHERE total_stock = 0) AS productos_sin_stock,
                    (SELECT COUNT(*) FROM ProdStock WHERE total_stock <= 5 AND total_stock > 0) AS productos_stock_bajo,
                    (SELECT ISNULL(SUM(CAST(total_stock AS BIGINT) * CAST(precio AS BIGINT)), 0) FROM ProdStock) AS valor_inventario,
                    (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @empresa_id) AS total_usuarios,
                    (SELECT COUNT(*) FROM Clientes WHERE empresa_id = @empresa_id) AS total_clientes,
                    (SELECT COUNT(*) FROM Facturas WHERE empresa_id = @empresa_id) AS total_facturas,
                    (SELECT ISNULL(SUM(total * ISNULL(tipo_cambio, 1)), 0) FROM Facturas WHERE empresa_id = @empresa_id AND estado != 'anulada') AS ventas_totales,
                    (SELECT COUNT(*) FROM Pagos WHERE empresa_id = @empresa_id AND estado = 'approved') AS pagos_aprobados,
                    (SELECT ISNULL(SUM(monto), 0) FROM Pagos WHERE empresa_id = @empresa_id AND estado = 'approved') AS monto_pagos,
                    (SELECT COUNT(*) FROM Movimientos WHERE empresa_id = @empresa_id) AS total_movimientos,
                    (SELECT COUNT(*) FROM Movimientos WHERE empresa_id = @empresa_id AND tipo = 'entrada') AS total_entradas,
                    (SELECT COUNT(*) FROM Movimientos WHERE empresa_id = @empresa_id AND tipo = 'salida') AS total_salidas,
                    (SELECT ISNULL(SUM(monto_adeudado - monto_cobrado), 0) FROM Cuentas_Cobrar WHERE empresa_id = @empresa_id AND estado != 'COBRADA') AS total_por_cobrar,
                    (SELECT ISNULL(SUM(monto_adeudado - CAST(ISNULL(monto_pagado, 0) AS DECIMAL(18,2))), 0) FROM Cuentas_Pagar WHERE empresa_id = @empresa_id AND estado != 'PAGADA') AS total_por_pagar
            `);

        const stats = r.recordset[0] || {};

        // 2. Columnas opcionales (pueden no existir si la migración fue parcial)
        try {
            const r2 = await pool.request()
                .input('empresa_id', sql.Int, empresa_id)
                .query(`
                    SELECT TOP 1
                        [plan] AS plan_activo,
                        fecha_registro AS miembro_desde
                    FROM Empresa WHERE id = @empresa_id
                `);
            Object.assign(stats, r2.recordset[0] || {});
        } catch {
            stats.plan_activo = 'starter';
            stats.miembro_desde = null;
        }

        return stats;
    }

}

module.exports = new EmpresaModel();
