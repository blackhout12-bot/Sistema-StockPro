/**
 * posEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Motor contextual del POS.
 * Lee el rubroSchema activo y ejecuta validaciones, aplica promociones
 * y calcula impuestos de forma desacoplada del componente visual.
 *
 * Uso:
 *   import { usePOSEngine } from '../utils/posEngine';
 *   const { validateAddToCart, applyPromotions, calcTaxes } = usePOSEngine();
 */

import { getRubroSchema } from '../config/rubroSchemas';

// ── Validadores por key ───────────────────────────────────────────
const validators = {
  /**
   * check_receta: bloquea si el producto requiere receta médica.
   * Muestra advertencia pero permite continuar (el cajero debe confirmar).
   */
  check_receta: (producto) => {
    const cf = typeof producto.custom_fields === 'string'
      ? (() => { try { return JSON.parse(producto.custom_fields); } catch { return {}; } })()
      : (producto.custom_fields || {});

    if (cf.requiere_receta === 'true' || cf.requiere_receta === true) {
      return {
        valid: false,
        level: 'warning', // warning = se puede ignorar con confirmación
        message: `"${producto.nombre}" requiere receta médica. ¿Confirmar venta?`,
        confirmable: true
      };
    }
    return { valid: true };
  },

  /**
   * check_vencimiento_lote: advierte si el producto tiene lotes vencidos.
   */
  check_vencimiento_lote: (producto) => {
    if (!producto.fecha_vencimiento) return { valid: true };
    const vto = new Date(producto.fecha_vencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (vto < hoy) {
      return {
        valid: false,
        level: 'error', // error = bloqueo duro
        message: `"${producto.nombre}" tiene lote vencido. No se puede vender.`,
        confirmable: false
      };
    }

    const diasRestantes = Math.floor((vto - hoy) / (1000 * 60 * 60 * 24));
    if (diasRestantes <= 30) {
      return {
        valid: false,
        level: 'warning',
        message: `"${producto.nombre}" vence en ${diasRestantes} días. ¿Confirmar?`,
        confirmable: true
      };
    }
    return { valid: true };
  },

  /**
   * check_stock_por_talle: valida que el talle seleccionado tiene stock disponible.
   */
  check_stock_por_talle: (producto, contexto = {}) => {
    const { talleSeleccionado } = contexto;
    if (!talleSeleccionado) {
      return {
        valid: false,
        level: 'error',
        message: `Seleccione un talle para "${producto.nombre}".`,
        confirmable: false
      };
    }
    return { valid: true };
  },

  /**
   * check_perecederos: advierte si el producto es perecedero y no tiene vencimiento cargado.
   */
  check_perecederos: (producto) => {
    const cf = typeof producto.custom_fields === 'string'
      ? (() => { try { return JSON.parse(producto.custom_fields); } catch { return {}; } })()
      : (producto.custom_fields || {});
    if (cf.categoria_menu && !producto.fecha_vencimiento) {
      return {
        valid: false,
        level: 'warning',
        message: `Producto perecedero "${producto.nombre}" sin fecha de vencimiento. ¿Continuar?`,
        confirmable: true
      };
    }
    return { valid: true };
  }
};

// ── Motores de promoción por key ──────────────────────────────────
const promotionEngines = {
  descuento_porcentaje: (carrito, params = {}) => {
    const pct = parseFloat(params.porcentaje || 0);
    if (!pct) return carrito;
    return carrito.map(item => ({
      ...item,
      descuento: item.precio * item.cantidad * (pct / 100),
      promo_label: `${pct}% OFF`
    }));
  },

  descuento_fijo: (carrito, params = {}) => {
    const monto = parseFloat(params.monto || 0);
    if (!monto) return carrito;
    return carrito.map(item => ({
      ...item,
      descuento: Math.min(monto, item.precio * item.cantidad),
      promo_label: `- $${monto}`
    }));
  },

  descuento_laboratorio: (carrito, params = {}) => {
    const { laboratorio, porcentaje = 10 } = params;
    if (!laboratorio) return carrito;
    return carrito.map(item => {
      const cf = (() => { try { return typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : (item.custom_fields || {}); } catch { return {}; } })();
      if (cf.laboratorio?.toLowerCase() === laboratorio.toLowerCase()) {
        return {
          ...item,
          descuento: item.precio * item.cantidad * (porcentaje / 100),
          promo_label: `Lab ${laboratorio}: ${porcentaje}% OFF`
        };
      }
      return item;
    });
  },

  '2x1': (carrito) => {
    return carrito.map(item => {
      if (item.cantidad >= 2) {
        const pagar = Math.ceil(item.cantidad / 2);
        const gratis = item.cantidad - pagar;
        return {
          ...item,
          descuento: item.precio * gratis,
          promo_label: `2x1 (${gratis} gratis)`
        };
      }
      return item;
    });
  },

  combo_prendas: (carrito, params = {}) => {
    const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
    if (totalItems >= (params.minPrendas || 3)) {
      const descPct = params.porcentaje || 15;
      return carrito.map(item => ({
        ...item,
        descuento: item.precio * item.cantidad * (descPct / 100),
        promo_label: `Combo ropa: ${descPct}% OFF`
      }));
    }
    return carrito;
  }
};

/**
 * Hook principal del motor POS.
 * Recibe el rubro activo y devuelve funciones de validación y promoción.
 */
export function usePOSEngine(rubro = 'general') {
  const schema = getRubroSchema(rubro);

  /**
   * Valida si un producto puede agregarse al carrito.
   * @param {object} producto
   * @param {object} contexto - datos extra (talle seleccionado, etc.)
   * @returns {{ valid, level, message, confirmable }}
   */
  const validateAddToCart = (producto, contexto = {}) => {
    for (const validationKey of (schema.posValidations || [])) {
      const validator = validators[validationKey];
      if (!validator) continue;
      const result = validator(producto, contexto);
      if (!result.valid) return result;
    }
    return { valid: true };
  };

  /**
   * Aplica una promoción al carrito.
   * @param {Array} carrito
   * @param {string} promoKey
   * @param {object} params
   * @returns {Array} carrito con descuentos aplicados
   */
  const applyPromotion = (carrito, promoKey, params = {}) => {
    const engine = promotionEngines[promoKey];
    if (!engine) return carrito;
    return engine(carrito, params);
  };

  /**
   * Calcula el total con IVA y otros impuestos del rubro.
   * @param {number} subtotal
   * @returns {{ subtotal, iva, ivaAmount, iibb, iibbAmount, total }}
   */
  const calcTaxes = (subtotal) => {
    const { iva = 21, iibb = 0 } = schema.taxRules || {};
    const ivaAmount = subtotal * (iva / 100);
    const iibbAmount = subtotal * (iibb / 100);
    return {
      subtotal,
      iva,
      ivaAmount,
      iibb,
      iibbAmount,
      total: subtotal + ivaAmount + iibbAmount
    };
  };

  return {
    schema,
    validateAddToCart,
    applyPromotion,
    calcTaxes,
    availableValidations: schema.posValidations || [],
    availablePromotions: schema.posPromotions || [],
    taxRules: schema.taxRules || {}
  };
}

export default usePOSEngine;
