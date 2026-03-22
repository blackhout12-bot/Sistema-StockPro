/**
 * rubroSchemas.js
 * ─────────────────────────────────────────────────────────────────
 * Define los campos extra, validaciones del POS y reglas de impuestos
 * por rubro de empresa.
 *
 * Para agregar un nuevo rubro: solo agregar una entrada al objeto.
 * ProductForm y el POS leen este archivo dinámicamente.
 *
 * Estructura de cada rubro:
 *   label          - nombre visible
 *   icon           - emoji o string descriptivo
 *   productFields  - campos extra del formulario de productos
 *   posValidations - lista de key de validaciones activas en el POS
 *   posPromotions  - lista de key de tipos de promoción disponibles
 *   taxRules       - reglas de impuestos (IVA, IIBB, tasas especiales)
 *   stockRules     - reglas de control de stock (por talle, lote, etc.)
 */

export const rubroSchemas = {

  // ── General (default) ─────────────────────────────────────────
  general: {
    label: 'General / Comercio',
    icon: '🏪',
    productFields: [],
    posValidations: [],
    posPromotions: ['descuento_porcentaje', 'descuento_fijo'],
    taxRules: { iva: 21, iibb: 3 },
    stockRules: {}
  },

  // ── Farmacia ──────────────────────────────────────────────────
  farmacia: {
    label: 'Farmacia',
    icon: '💊',
    productFields: [
      { key: 'laboratorio',       label: 'Laboratorio',           type: 'text',     required: true,  section: 'Datos Farmacéuticos' },
      { key: 'principio_activo',  label: 'Principio Activo',      type: 'text',     required: false, section: 'Datos Farmacéuticos' },
      { key: 'droga',             label: 'Droga / Monodroga',     type: 'text',     required: false, section: 'Datos Farmacéuticos' },
      { key: 'requiere_receta',   label: 'Requiere Receta Médica',type: 'checkbox', required: false, section: 'Datos Farmacéuticos' },
      { key: 'troquel',           label: 'Número de Troquel',     type: 'text',     required: false, section: 'Regulatorio' },
      { key: 'registro_anmat',    label: 'Registro ANMAT',        type: 'text',     required: false, section: 'Regulatorio' },
      { key: 'concentracion',     label: 'Concentración',         type: 'text',     required: false, section: 'Datos Farmacéuticos' },
      { key: 'forma_farmaceutica',label: 'Forma Farmacéutica',    type: 'select',   required: false, section: 'Datos Farmacéuticos',
        options: ['Comprimidos','Cápsulas','Jarabe','Solución oral','Inyectable','Crema','Gel','Pomada','Gotas'] }
    ],
    posValidations: ['check_receta', 'check_vencimiento_lote'],
    posPromotions: ['descuento_laboratorio', 'descuento_porcentaje'],
    taxRules: { iva: 10.5, iibb: 2 },
    stockRules: { requires_lote: true, tracks_vencimiento: true }
  },

  // ── Indumentaria ──────────────────────────────────────────────
  indumentaria: {
    label: 'Indumentaria / Ropa',
    icon: '👗',
    productFields: [
      { key: 'marca',    label: 'Marca',         type: 'text',   required: false, section: 'Atributos' },
      { key: 'talle',    label: 'Talle',         type: 'select', required: false, section: 'Atributos',
        options: ['XS','S','M','L','XL','XXL','XXXL','34','36','38','40','42','44','46','48'] },
      { key: 'color',    label: 'Color',         type: 'text',   required: false, section: 'Atributos' },
      { key: 'material', label: 'Material',      type: 'text',   required: false, section: 'Atributos' },
      { key: 'temporada',label: 'Temporada',     type: 'select', required: false, section: 'Atributos',
        options: ['Verano 2025','Invierno 2025','Verano 2026','Invierno 2026','Todo el año'] },
      { key: 'genero',   label: 'Género',        type: 'select', required: false, section: 'Atributos',
        options: ['Hombre','Mujer','Unisex','Niño','Niña'] }
    ],
    posValidations: ['check_stock_por_talle'],
    posPromotions: ['combo_prendas', '2x1', 'descuento_porcentaje', 'descuento_fijo'],
    taxRules: { iva: 21, iibb: 3 },
    stockRules: { variant_key: 'talle' }
  },

  // ── Restaurante / Gastronomía ─────────────────────────────────
  restaurante: {
    label: 'Restaurante / Gastronomía',
    icon: '🍔',
    productFields: [
      { key: 'categoria_menu', label: 'Categoría de Menú', type: 'select', required: false, section: 'Menú',
        options: ['Entradas','Platos Principales','Postres','Bebidas','Empanadas','Pizzas','Hamburguesas','Ensaladas'] },
      { key: 'tiempo_prep',    label: 'Tiempo de Preparación (min)', type: 'number', required: false, section: 'Menú' },
      { key: 'calorias',       label: 'Calorías',             type: 'number', required: false, section: 'Información Nutricional' },
      { key: 'alergenos',      label: 'Alérgenos',            type: 'text',   required: false, section: 'Información Nutricional' },
      { key: 'apto_celiac',    label: 'Apto Celíaco',         type: 'checkbox',required: false, section: 'Información Nutricional' },
      { key: 'apto_vegano',    label: 'Apto Vegano',          type: 'checkbox',required: false, section: 'Información Nutricional' }
    ],
    posValidations: ['check_perecederos', 'check_vencimiento_lote'],
    posPromotions: ['combo_menu', 'happy_hour', 'descuento_porcentaje'],
    taxRules: { iva: 21, iibb: 3, tasa_municipal: 0 },
    stockRules: { requires_lote: true, tracks_vencimiento: true, is_consumable: true }
  },

  // ── Supermercado ──────────────────────────────────────────────
  supermercado: {
    label: 'Supermercado / Almacén',
    icon: '🛒',
    productFields: [
      { key: 'marca',       label: 'Marca',             type: 'text',   required: false, section: 'Producto' },
      { key: 'codigo_ean',  label: 'Código de Barras EAN', type: 'text', required: false, section: 'Producto' },
      { key: 'unidad_venta',label: 'Unidad de Venta',   type: 'select', required: false, section: 'Producto',
        options: ['Unidad','Kg','Gramos','Litro','ml','Docena','Pack','Caja'] },
      { key: 'fraccionable',label: 'Fraccionable',      type: 'checkbox',required: false, section: 'Producto' }
    ],
    posValidations: ['check_perecederos', 'check_vencimiento_lote'],
    posPromotions: ['2x1', 'descuento_porcentaje', 'descuento_fijo', 'precio_lista'],
    taxRules: { iva: 10.5, iibb: 3 },
    stockRules: { requires_lote: true, tracks_vencimiento: true }
  },

  // ── Librería / Papelería ──────────────────────────────────────
  libreria: {
    label: 'Librería / Papelería',
    icon: '📚',
    productFields: [
      { key: 'editorial',    label: 'Editorial',          type: 'text',   required: false, section: 'Bibliográfico' },
      { key: 'autor',        label: 'Autor',              type: 'text',   required: false, section: 'Bibliográfico' },
      { key: 'isbn',         label: 'ISBN',               type: 'text',   required: false, section: 'Bibliográfico' },
      { key: 'edicion',      label: 'Edición / Año',      type: 'text',   required: false, section: 'Bibliográfico' },
      { key: 'idioma',       label: 'Idioma',             type: 'select', required: false, section: 'Bibliográfico',
        options: ['Español','Inglés','Portugués','Francés','Alemán','Italiano'] }
    ],
    posValidations: [],
    posPromotions: ['descuento_porcentaje', 'descuento_fijo', '2x1'],
    taxRules: { iva: 10.5, iibb: 2 },
    stockRules: {}
  },

  // ── Ferretería ────────────────────────────────────────────────
  ferreteria: {
    label: 'Ferretería / Materiales',
    icon: '🔧',
    productFields: [
      { key: 'marca',    label: 'Marca',                 type: 'text',   required: false, section: 'Producto' },
      { key: 'medida',   label: 'Medida / Dimensión',    type: 'text',   required: false, section: 'Producto' },
      { key: 'material', label: 'Material',              type: 'text',   required: false, section: 'Producto' },
      { key: 'unidad',   label: 'Unidad de venta',       type: 'select', required: false, section: 'Producto',
        options: ['Unidad','Metro','Metro²','Litro','Kg','Caja','Pack'] }
    ],
    posValidations: [],
    posPromotions: ['descuento_porcentaje', 'descuento_fijo'],
    taxRules: { iva: 21, iibb: 3 },
    stockRules: {}
  }
};

/**
 * Retorna el schema del rubro activo, con fallback a 'general'.
 * @param {string} rubro
 * @returns {object}
 */
export function getRubroSchema(rubro) {
  return rubroSchemas[rubro] || rubroSchemas.general;
}

/**
 * Lista de opciones para el selector de rubro en Empresa.
 */
export const rubroOptions = Object.entries(rubroSchemas).map(([key, schema]) => ({
  value: key,
  label: `${schema.icon} ${schema.label}`
}));
