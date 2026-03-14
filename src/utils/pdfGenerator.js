const puppeteer = require('puppeteer');

async function generateInvoicePDF(factura, config = {}) {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; }
            table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            table td { padding: 5px; vertical-align: top; }
            .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
            .title { font-size: 45px; line-height: 45px; color: ${config.color_primario || '#4F46E5'}; font-weight: bold; }
            .info-right { text-align: right; }
            .heading { background: #f9f9f9; font-weight: bold; }
            .item td { border-bottom: 1px solid #eee; }
            .item.last td { border-bottom: none; }
            .total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; color: #777; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header-info">
                <div>
                    <div class="title">FACTURA</div>
                    <br>
                    <strong>Emisor:</strong> ${factura.empresa_nombre_snapshot || 'Sistema de Gestión'}<br>
                    ${factura.empresa_nit_snapshot ? `NIT/CUIT: ${factura.empresa_nit_snapshot}<br>` : ''}
                    ${factura.empresa_direccion_snapshot ? `Dir: ${factura.empresa_direccion_snapshot}<br>` : ''}
                </div>
                <div class="info-right">
                    <strong>Factura #:</strong> ${factura.nro_factura || 'N/A'}<br>
                    <strong>Fecha:</strong> ${new Date(factura.fecha_emision).toLocaleDateString()}<br>
                    <strong>Estado:</strong> ${factura.estado || 'Emitida'}
                </div>
            </div>

            <table cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
                <tr>
                    <td>
                        <strong>Facturar a:</strong><br>
                        ${factura.cliente_nombre || 'Cliente Final'}<br>
                        ${factura.cliente_doc ? `Doc: ${factura.cliente_doc}` : ''}
                    </td>
                    <td class="info-right">
                        <strong>Vendedor:</strong><br>
                        ${factura.vendedor_nombre || 'Vendedor'}
                    </td>
                </tr>
            </table>

            <table cellpadding="0" cellspacing="0">
                <tr class="heading">
                    <td>Producto</td>
                    <td style="text-align: right;">Cant</td>
                    <td style="text-align: right;">P. Unit</td>
                    <td style="text-align: right;">Subtotal</td>
                </tr>
                ${(factura.detalles || []).map((item, index) => `
                <tr class="item ${index === (factura.detalles?.length || 0) - 1 ? 'last' : ''}">
                    <td>${item.producto_nombre || item.producto_nombre_snapshot || 'Producto Genérico'}</td>
                    <td style="text-align: right;">${item.cantidad}</td>
                    <td style="text-align: right;">$${Number(item.precio_unitario).toFixed(2)}</td>
                    <td style="text-align: right;">$${Number(item.subtotal).toFixed(2)}</td>
                </tr>
                `).join('')}
                
                <tr class="total">
                    <td colspan="2"></td>
                    <td style="text-align: right;"><strong>Total:</strong></td>
                    <td style="text-align: right;"><strong>$${Number(factura.total).toFixed(2)}</strong></td>
                </tr>
            </table>
            
            <div class="footer">
                ${config.pie_comprobante || 'Gracias por su compra. Documento generado automáticamente.'}
            </div>
        </div>
    </body>
    </html>
    `;

    // Use specific args to run stably in most environments without root
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return pdfBuffer;
}

module.exports = { generateInvoicePDF };
