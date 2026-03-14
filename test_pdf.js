const { generateInvoicePDF } = require('./src/utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const mockFactura = {
    empresa_nombre_snapshot: 'Empresa Test',
    nro_factura: 'T0001-TEST',
    fecha_emision: new Date().toISOString(),
    cliente_nombre: 'Edgardo Test',
    cliente_doc: '20-12345678-9',
    vendedor_nombre: 'Admin',
    total: 1500.50,
    detalles: [
        { producto_nombre: 'Producto A', cantidad: 2, precio_unitario: 500, subtotal: 1000 },
        { producto_nombre: 'Producto B', cantidad: 1, precio_unitario: 500.50, subtotal: 500.50 }
    ]
};

async function test() {
    try {
        console.log('Generando PDF de prueba...');
        const buffer = await generateInvoicePDF(mockFactura);
        const outputPath = path.join(__dirname, 'test_invoice.pdf');
        fs.writeFileSync(outputPath, buffer);
        console.log(`PDF generado exitosamente en: ${outputPath}`);
        process.exit(0);
    } catch (err) {
        console.error('Error generando PDF:', err);
        process.exit(1);
    }
}

test();
