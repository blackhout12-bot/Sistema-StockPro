const puppeteer = require('puppeteer');

async function generateInvoicePDF(factura, config = {}) {
    const isDesgloseAvailable = factura.subtotal !== null && factura.subtotal !== undefined;
    const subtotalStr = isDesgloseAvailable ? Number(factura.subtotal).toFixed(2) : Number(factura.total).toFixed(2);
    const impuestosStr = isDesgloseAvailable ? Number(factura.impuestos).toFixed(2) : '0.00';
    const totalStr = Number(factura.total).toFixed(2);

    const colorAcento = config.color_primario || '#0F172A'; // Dark Slate for premium minimalist look

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --accent: ${colorAcento};
                --text-main: #0f172a;
                --text-muted: #64748b;
                --border-light: #f1f5f9;
                --border-dark: #cbd5e1;
            }
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0; 
                padding: 0; 
                color: var(--text-main); 
                background: white;
                -webkit-font-smoothing: antialiased;
            }
            .invoice-wrapper {
                width: 210mm;
                min-height: 297mm;
                margin: auto;
                padding: 12mm 15mm;
                box-sizing: border-box;
                position: relative;
            }
            
            /* Top Corporate Stripe */
            .top-stripe {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 8px;
                background: var(--accent);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-top: 15px;
                margin-bottom: 40px;
            }
            .header-brand h1 {
                font-size: 26px;
                font-weight: 800;
                letter-spacing: -0.5px;
                margin: 0 0 6px 0;
                color: var(--text-main);
                text-transform: uppercase;
            }
            .header-brand p {
                margin: 0;
                font-size: 11px;
                color: var(--text-muted);
                line-height: 1.5;
            }
            .invoice-title-block {
                text-align: right;
            }
            .invoice-title-block h2 {
                margin: 0 0 8px 0;
                font-size: 36px;
                font-weight: 300;
                color: var(--text-main);
                letter-spacing: -1px;
                text-transform: uppercase;
            }
            .invoice-title-block p {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-muted);
                margin: 0 0 4px 0;
                letter-spacing: 1px;
            }
            .invoice-title-block .badge {
                display: inline-block;
                padding: 4px 10px;
                background: var(--border-light);
                color: var(--text-main);
                font-size: 10px;
                font-weight: 700;
                border-radius: 4px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 5px;
            }

            .info-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 30px;
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 1px solid var(--border-light);
            }
            .info-box {
                flex: 1;
                min-width: 200px;
            }
            .info-box label {
                display: block;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: var(--text-muted);
                margin-bottom: 8px;
            }
            .info-box strong {
                display: block;
                font-size: 15px;
                font-weight: 600;
                color: var(--text-main);
                margin-bottom: 4px;
            }
            .info-box p {
                margin: 0;
                font-size: 12px;
                color: var(--text-muted);
                line-height: 1.5;
            }

            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 40px;
            }
            th {
                text-align: left;
                padding: 12px 8px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-muted);
                border-bottom: 2px solid var(--text-main);
            }
            th.right, td.right { text-align: right; }
            th.center, td.center { text-align: center; }
            
            td {
                padding: 16px 8px;
                font-size: 12px;
                color: var(--text-main);
                border-bottom: 1px solid var(--border-light);
                vertical-align: middle;
            }
            .item-name { 
                font-weight: 600; 
                color: var(--text-main);
                font-size: 13px;
                margin-bottom: 3px;
            }
            .item-sku {
                font-size: 10px;
                color: var(--text-muted);
            }

            .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 50px;
            }
            .summary-box {
                width: 300px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 13px;
                color: var(--text-muted);
            }
            .summary-row strong { 
                color: var(--text-main); 
                font-weight: 600;
            }
            
            .summary-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
                padding-top: 15px;
                border-top: 2px solid var(--text-main);
            }
            .summary-total span {
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                color: var(--text-main);
                letter-spacing: 1px;
            }
            .summary-total .amount {
                font-size: 28px;
                font-weight: 800;
                color: var(--text-main);
                letter-spacing: -1px;
            }

            .footer {
                position: absolute;
                bottom: 15mm;
                left: 15mm;
                right: 15mm;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding-top: 20px;
            }
            .footer-info {
                font-size: 11px;
                color: var(--text-muted);
                line-height: 1.6;
            }
            .footer-info strong {
                color: var(--text-main);
                font-weight: 600;
            }
            .barcode-placeholder {
                font-family: 'Libre Barcode 39', monospace;
                font-size: 40px;
                color: var(--text-main);
                line-height: 1;
                margin-bottom: -5px;
            }
            
            .metodo-pago-tag {
                display: inline-block;
                padding: 4px 10px;
                background: var(--border-light);
                border: 1px solid var(--border-dark);
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                color: var(--text-main);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 10px;
            }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
    </head>
    <body>
        <div class="invoice-wrapper">
            <div class="top-stripe"></div>
            
            <div class="header">
                <div class="header-brand">
                    <h1>${factura.empresa_nombre_snapshot || 'Sistema ERP'}</h1>
                    <p>
                        ${factura.empresa_direccion_snapshot ? `${factura.empresa_direccion_snapshot}<br>` : ''}
                        ${factura.empresa_nit_snapshot ? `<strong>NIF/CUIT:</strong> ${factura.empresa_nit_snapshot}<br>` : ''}
                        ${factura.empresa_telefono_snapshot ? `<strong>Tel:</strong> ${factura.empresa_telefono_snapshot}<br>` : ''}
                    </p>
                </div>
                <div class="invoice-title-block">
                    <h2>${factura.tipo_comprobante || 'Factura'}</h2>
                    <p>Nº ${factura.nro_factura || 'N/A'}</p>
                    <p>FECHA: ${new Date(factura.fecha_emision || Date.now()).toLocaleDateString('es-AR')}</p>
                    <div class="badge">${factura.origen_venta || 'LOCAL'}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <label>Cliente / Receptor</label>
                    <strong>${factura.cliente_nombre || 'Consumidor Final'}</strong>
                    ${factura.cliente_doc ? `<p>DOC/CUIT: ${factura.cliente_doc}</p>` : '<p>DOC/CUIT: 99999999</p>'}
                </div>
                <div class="info-box">
                    <label>Datos Adicionales</label>
                    <p><strong>Cajero:</strong> ${factura.vendedor_nombre || 'Sistema'}</p>
                    <p><strong>Estado:</strong> ${factura.estado || 'Emitida'}</p>
                    <p><strong>Moneda:</strong> ${factura.moneda || 'ARS'}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="45%">Descripción</th>
                        <th class="center" width="15%">Cant.</th>
                        <th class="right" width="20%">P. Unitario</th>
                        <th class="right" width="20%">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${(factura.detalles || []).map((item) => `
                    <tr>
                        <td>
                            <div class="item-name">${item.producto_nombre || item.producto_nombre_snapshot || 'Artículo Genérico'}</div>
                            <div class="item-sku">SKU REF-${item.producto_id}</div>
                        </td>
                        <td class="center">${item.cantidad}</td>
                        <td class="right">$${Number(item.precio_unitario).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                        <td class="right"><strong>$${Number(item.subtotal).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="summary-section">
                <div class="summary-box">
                    <div class="summary-row">
                        <span>Subtotal Neto</span>
                        <strong>$${Number(subtotalStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Impuestos Adicionales</span>
                        <strong>$${Number(impuestosStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
                    </div>
                    
                    <div class="summary-total">
                        <span>Total de Operación</span>
                        <div class="amount">$${Number(totalStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                    </div>
                    
                    <div style="text-align: right;">
                        <span class="metodo-pago-tag">${factura.metodo_pago || 'Medio no especificado'}</span>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-info">
                    <strong>Términos y Condiciones</strong><br>
                    ${config.pie_comprobante || 'Documento no válido como factura de crédito. Los cambios se aceptan dentro de los 30 días.'}
                </div>
                <div>
                    <div class="barcode-placeholder">*${(factura.nro_factura || '0000').replace(/[^a-zA-Z0-9]/g, '')}*</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Modern Puppeteer Launch Config for Stability in Servers/Docker
    const browser = await puppeteer.launch({
        headless: true, // "new" is deprecated
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    
    try {
        const page = await browser.newPage();
        
        // waitUntil: 'networkidle0' ensures fonts (Inter, Libre Barcode) are fully loaded
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 } // handled by CSS wrapper padding
        });
        
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { generateInvoicePDF };
