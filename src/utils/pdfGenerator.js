const puppeteer = require('puppeteer');

async function generateInvoicePDF(factura, config = {}) {
    const isDesgloseAvailable = factura.subtotal !== null && factura.subtotal !== undefined;
    const subtotalStr = isDesgloseAvailable ? Number(factura.subtotal).toFixed(2) : Number(factura.total).toFixed(2);
    const impuestosStr = isDesgloseAvailable ? Number(factura.impuestos).toFixed(2) : '0.00';
    const totalStr = Number(factura.total).toFixed(2);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            :root {
                --primary: ${config.color_primario || '#4F46E5'};
                --primary-light: ${config.color_primario ? config.color_primario + '15' : '#EEF2FF'};
                --text-main: #1E293B;
                --text-muted: #64748B;
                --border-color: #E2E8F0;
            }
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; 
                padding: 0; 
                color: var(--text-main); 
                -webkit-font-smoothing: antialiased;
            }
            .invoice-wrapper {
                background: white;
                max-width: 210mm;
                min-height: 297mm;
                margin: auto;
                padding: 50px 60px;
                box-sizing: border-box;
                position: relative;
            }
            
            /* Decoración de esquina superior */
            .corner-decoration {
                position: absolute;
                top: 0;
                right: 0;
                width: 300px;
                height: 300px;
                background: var(--primary-light);
                border-bottom-left-radius: 100%;
                z-index: 0;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 50px;
                position: relative;
                z-index: 10;
            }
            .header-brand h1 {
                font-size: 32px;
                font-weight: 900;
                letter-spacing: -1px;
                margin: 0 0 10px 0;
                color: var(--primary);
            }
            .header-brand p {
                margin: 0;
                font-size: 13px;
                color: var(--text-muted);
                line-height: 1.6;
            }
            .invoice-title-block {
                text-align: right;
            }
            .invoice-title-block h2 {
                margin: 0;
                font-size: 48px;
                font-weight: 900;
                color: var(--text-main);
                letter-spacing: -2px;
                text-transform: uppercase;
            }
            .invoice-title-block p {
                font-size: 14px;
                font-weight: 700;
                color: var(--primary);
                margin: 5px 0 0 0;
                letter-spacing: 2px;
            }

            .info-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 40px;
                position: relative;
                z-index: 10;
            }
            .info-box {
                flex: 1;
                min-width: 200px;
                background: #F8FAFC;
                padding: 24px;
                border-radius: 16px;
                border: 1px solid var(--border-color);
            }
            .info-box label {
                display: block;
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-muted);
                margin-bottom: 8px;
            }
            .info-box strong {
                display: block;
                font-size: 16px;
                color: var(--text-main);
                margin-bottom: 4px;
            }
            .info-box p {
                margin: 0;
                font-size: 13px;
                color: var(--text-muted);
            }

            table { 
                width: 100%; 
                border-collapse: separate; 
                border-spacing: 0;
                margin-bottom: 40px;
                position: relative;
                z-index: 10;
            }
            th {
                text-align: left;
                padding: 16px;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-muted);
                border-bottom: 2px solid var(--border-color);
            }
            th.right, td.right { text-align: right; }
            th.center, td.center { text-align: center; }
            
            td {
                padding: 16px;
                font-size: 14px;
                color: var(--text-main);
                border-bottom: 1px solid #F1F5F9;
                vertical-align: middle;
            }
            .item-name { font-weight: 700; }
            table tr:last-child td { border-bottom: none; }

            .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 60px;
            }
            .summary-box {
                min-width: 350px;
                background: #F8FAFC;
                border-radius: 20px;
                padding: 30px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding-bottom: 16px;
                margin-bottom: 16px;
                border-bottom: 1px dashed var(--border-color);
                font-size: 14px;
                color: var(--text-muted);
            }
            .summary-row strong { color: var(--text-main); }
            
            .summary-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
            }
            .summary-total span {
                font-size: 14px;
                font-weight: 800;
                text-transform: uppercase;
                color: var(--text-muted);
                letter-spacing: 1px;
            }
            .summary-total .amount {
                font-size: 32px;
                font-weight: 900;
                color: var(--primary);
                letter-spacing: -1px;
            }

            .footer {
                position: absolute;
                bottom: 50px;
                left: 60px;
                right: 60px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding-top: 30px;
                border-top: 2px solid #F1F5F9;
            }
            .footer-info {
                font-size: 12px;
                color: var(--text-muted);
            }
            .footer-info strong {
                color: var(--text-main);
            }
            .qr-placeholder {
                width: 80px;
                height: 80px;
                background: #F1F5F9;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .qr-placeholder svg {
                width: 40px;
                height: 40px;
                color: var(--text-muted);
                opacity: 0.5;
            }
        </style>
    </head>
    <body>
        <div class="invoice-wrapper">
            <div class="corner-decoration"></div>
            
            <div class="header">
                <div class="header-brand">
                    <h1>${factura.empresa_nombre_snapshot || 'Sistema ERP'}</h1>
                    <p>
                        ${factura.empresa_direccion_snapshot ? `${factura.empresa_direccion_snapshot}<br>` : ''}
                        ${factura.empresa_nit_snapshot ? `<strong>CUIT/NIF:</strong> ${factura.empresa_nit_snapshot}<br>` : ''}
                        <strong>Fecha Emisión:</strong> ${new Date(factura.fecha_emision || Date.now()).toLocaleDateString('es-AR')}
                    </p>
                </div>
                <div class="invoice-title-block">
                    <h2>${factura.tipo_comprobante || 'Factura'}</h2>
                    <p>Nº ${factura.nro_factura || 'N/A'}</p>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <label>Cobrar A</label>
                    <strong>\${factura.cliente_nombre || 'Consumidor Final'}</strong>
                    \${factura.cliente_doc ? \`<p>Documento: \${factura.cliente_doc}</p>\` : ''}
                </div>
                <div class="info-box">
                    <label>Detalles de Operación</label>
                    <p><strong>Cajero / Empleado:</strong> \${factura.vendedor_nombre || 'N/A'}</p>
                    <p><strong>Estado:</strong> \${factura.estado || 'Emitida'}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="50%">Descripción del Producto</th>
                        <th class="center" width="15%">Cantidad</th>
                        <th class="right" width="15%">P. Unitario</th>
                        <th class="right" width="20%">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    \${(factura.detalles || []).map((item) => \`
                    <tr>
                        <td>
                            <div class="item-name">\${item.producto_nombre || item.producto_nombre_snapshot || 'Genérico'}</div>
                        </td>
                        <td class="center">x\${item.cantidad}</td>
                        <td class="right">$\${Number(item.precio_unitario).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                        <td class="right"><strong>$\${Number(item.subtotal).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong></td>
                    </tr>
                    \`).join('')}
                </tbody>
            </table>
            
            <div class="summary-section">
                <div class="summary-box">
                    <div class="summary-row">
                        <span>Subtotal (Neto)</span>
                        <strong>$\${Number(subtotalStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
                    </div>
                    <div class="summary-row">
                        <span>IVA / Impuestos</span>
                        <strong>$\${Number(impuestosStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
                    </div>
                    
                    <div class="summary-total">
                        <span>Total Importe</span>
                        <div class="amount">$${Number(totalStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-info">
                    <p><strong>Método de Pago:</strong> ${factura.metodo_pago || 'No especificado'}</p>
                    <p>${config.pie_comprobante || 'Documento generado automáticamente. Gracias por su confianza.'}</p>
                </div>
                <div class="qr-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5z"/>
                        <path d="M14 14h1v1h-1zM16 14h3v3h-3zM14 18h5v1h-5z"/>
                    </svg>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

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
