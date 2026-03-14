const { z } = require('zod');

/**
 * Esquemas de Validación para Configuración de Empresa (Fase 2 Extendida)
 *
 * Esquema para parámetros de Inventario Extendidos
 */
const inventarioConfigSchema = z.object({
    stock_critico: z.number().int().min(0).optional(),
    permitir_negativo: z.boolean().optional(),
    stock_max_global: z.number().int().min(0).nullable().optional(),
    alertas_habilitadas: z.boolean().optional(),
    alertas_canal: z.string().max(50).optional(),
    control_lotes: z.boolean().optional(),
    control_vencimientos: z.boolean().optional(),
}).strict();

/**
 * Esquema para Impuestos y Legal
 */
const impuestosConfigSchema = z.object({
    iva_defecto: z.number().min(0).max(100).optional(),
    cuit: z.string().max(20).nullable().optional(),
    condicion_fiscal: z.string().max(100).nullable().optional(),
    percepciones_json: z.string().nullable().optional(),
    retenciones_json: z.string().nullable().optional(),
}).strict();

/**
 * Esquema para configuración de Comprobantes (Series)
 */
const comprobanteSchema = z.object({
    tipo_comprobante: z.string().min(1, 'Tipo de comprobante requerido').max(50),
    prefijo: z.string().max(10).optional().default('0001'),
    proximo_nro: z.number().int().min(1, 'El número inicial debe ser >= 1'),
    activo: z.boolean().optional().default(true),
    plantilla_json: z.string().nullable().optional(),
}).strict();

/**
 * Esquema para Integraciones (Email/SMTP/AFIP/Meli)
 */
const integracionesSchema = z.object({
    email_host: z.string().max(255).nullable().optional(),
    email_port: z.number().int().nullable().optional(),
    afip_cuit: z.string().max(20).nullable().optional(),
    afip_punto_venta: z.number().int().min(1).nullable().optional(),
    afip_tipo_responsable: z.string().max(50).nullable().optional(),
    afip_certificado_path: z.string().max(1000).nullable().optional(),
    afip_key_path: z.string().max(1000).nullable().optional(),
    mercadopago_token: z.string().max(500).nullable().optional(),
    mercadolibre_token: z.string().max(500).nullable().optional(),
    ecommerce_url: z.string().max(500).nullable().optional(),
    ecommerce_secret: z.string().max(500).nullable().optional(),
    erp_key: z.string().max(500).nullable().optional(),
}).strict();

/**
 * Esquema para Dashboard
 */
const dashboardConfigSchema = z.object({
    kpis_visibles: z.string().nullable().optional(), // Expected stringified JSON array
    rango_default: z.string().max(50).optional(),
    refresco_segundos: z.number().int().min(0).optional(),
    widgets_visibles: z.string().nullable().optional(),
}).strict();

/**
 * Esquema para Branding extendido
 */
const brandingSchema = z.object({
    color_primario: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato Hexadecimal inválido').optional(),
    color_secundario: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato Hexadecimal inválido').optional(),
    eslogan: z.string().max(255).nullable().optional(),
    logo_url: z.string().url('URL de logo inválida').or(z.literal('')).nullable().optional(),
    nombre_fantasia: z.string().max(255).nullable().optional(),
}).strict();

/**
 * Esquema para configuración regional extendida
 */
const regionalSchema = z.object({
    moneda_base_id: z.string().max(3).optional(),
    zona_horaria: z.string().max(100).optional(),
    regional_formato_fecha: z.string().max(20).optional(),
    regional_formato_hora: z.string().max(20).optional(),
    regional_separador_decimal: z.string().max(1).optional(),
    idioma: z.string().max(10).optional(),
}).strict();

module.exports = {
    regionalSchema,
    brandingSchema,
    inventarioConfigSchema,
    impuestosConfigSchema,
    comprobanteSchema,
    integracionesSchema,
    dashboardConfigSchema
};
