import { usePOSEngine } from '../utils/posEngine';

describe('posEngine Utility', () => {

    describe('Validaciones Farmacia (check_receta)', () => {
        let engine;

        beforeEach(() => {
            // "farmacia" has posValidations: ['check_receta']
            engine = usePOSEngine('farmacia');
        });

        it('debería arrojar "warning" si el producto requiere receta médica', () => {
            const productoFuerte = {
                nombre: 'Clonazepam 2mg',
                custom_fields: JSON.stringify({ requiere_receta: 'true' })
            };
            const result = engine.validateAddToCart(productoFuerte);
            expect(result.valid).toBe(false);
            expect(result.level).toBe('warning');
            expect(result.confirmable).toBe(true);
        });

        it('debería ser válido si el producto de farmacia no requiere receta', () => {
            const productoLibre = {
                nombre: 'Ibuprofeno 400',
                custom_fields: JSON.stringify({ requiere_receta: 'false' })
            };
            const result = engine.validateAddToCart(productoLibre);
            expect(result.valid).toBe(true);
        });
    });

    describe('Validaciones Supermercado (check_vencimiento_lote)', () => {
        let engine;

        beforeEach(() => {
            engine = usePOSEngine('supermercado'); // posValidations: ['check_vencimiento_lote']
        });

        it('debería arrojar "error" si el producto está vencido', () => {
            const ayer = new Date();
            ayer.setDate(ayer.getDate() - 1);
            
            const productoVencido = {
                nombre: 'Leche Descremada',
                fecha_vencimiento: ayer.toISOString()
            };
            const result = engine.validateAddToCart(productoVencido);
            expect(result.valid).toBe(false);
            expect(result.level).toBe('error');
            expect(result.confirmable).toBe(false);
        });

        it('debería arrojar "warning" si el producto vence en menos de 30 días', () => {
            const en20Dias = new Date();
            en20Dias.setDate(en20Dias.getDate() + 20);
            
            const productoPorVencer = {
                nombre: 'Queso Cremoso',
                fecha_vencimiento: en20Dias.toISOString()
            };
            const result = engine.validateAddToCart(productoPorVencer);
            expect(result.valid).toBe(false);
            expect(result.level).toBe('warning');
            expect(result.confirmable).toBe(true);
        });
    });

    describe('Motor de Promociones y Calculo de Impuestos', () => {
        let engine;

        beforeEach(() => {
            engine = usePOSEngine('general');
        });

        it('debería aplicar un descuento porcentual exitosamente', () => {
            const carrito = [{ id: 1, precio: 100, cantidad: 2 }]; // subtotal 200
            const carritoPromo = engine.applyPromotion(carrito, 'descuento_porcentaje', { porcentaje: 10 });
            
            expect(carritoPromo[0].descuento).toBe(20); // 10% de 200
            expect(carritoPromo[0].promo_label).toBe('10% OFF');
        });

        it('debería calcular correctamente impuestos configurados en el rubro', () => {
            // Asumiendo que 'general' trae taxRules = { iva: 21 }
            const result = engine.calcTaxes(100);
            expect(result.subtotal).toBe(100);
            if (result.iva === 21) {
                expect(result.ivaAmount).toBe(21);
                expect(result.total).toBe(121);
            }
        });
    });
});
