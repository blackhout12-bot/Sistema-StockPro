const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateInvoicePDF(factura, config = {}) {
    // Si la factura contiene subtotal, es un comprobante desglosado (Factura A o B)
    const isDesgloseAvailable = factura.subtotal !== null && factura.subtotal !== undefined;
    const subtotalStr = isDesgloseAvailable ? Number(factura.subtotal).toFixed(2) : Number(factura.total).toFixed(2);
    const impuestosStr = isDesgloseAvailable ? Number(factura.impuestos).toFixed(2) : '0.00';
    const totalStr = Number(factura.total).toFixed(2);

    const colorAcento = config.color_primario || '#1e293b'; 

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --accent: ${colorAcento};
                --text-main: #0f172a;
                --text-muted: #64748b;
                --text-light: #94a3b8;
                --border-subtle: #f1f5f9;
                --border-dark: #e2e8f0;
                --bg-light: #f8fafc;
            }
            body { 
                font-family: 'Outfit', sans-serif; 
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
                padding: 15mm 20mm;
                box-sizing: border-box;
                position: relative;
                background-color: #ffffff;
            }
            
            /* Watermark / Logo background */
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.02;
                font-size: 150px;
                font-weight: 800;
                color: var(--accent);
                z-index: 0;
                pointer-events: none;
                user-select: none;
                white-space: nowrap;
            }

            .content-layer {
                position: relative;
                z-index: 10;
            }

            /* Header Section */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 25px;
                border-bottom: 2px solid var(--accent);
                margin-bottom: 35px;
            }
            
            .company-info {
                max-width: 45%;
            }
            .company-info h1 {
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.03em;
                margin: 0 0 8px 0;
                color: var(--text-main);
                line-height: 1.1;
            }
            .company-info p {
                margin: 0 0 3px 0;
                font-size: 11px;
                font-weight: 400;
                color: var(--text-muted);
                line-height: 1.5;
            }
            .company-info p strong {
                font-weight: 600;
                color: var(--text-main);
            }

            .document-details {
                text-align: right;
            }
            .document-details h2 {
                margin: 0 0 8px 0;
                font-size: 32px;
                font-weight: 300;
                color: var(--text-main);
                letter-spacing: -0.02em;
                text-transform: uppercase;
            }
            .doc-meta {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 4px;
            }
            .doc-meta-item {
                font-size: 13px;
                display: flex;
                gap: 10px;
            }
            .doc-meta-item span.label {
                color: var(--text-light);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-size: 11px;
                padding-top: 2px;
            }
            .doc-meta-item span.value {
                font-weight: 700;
                color: var(--text-main);
                min-width: 100px;
                text-align: right;
            }

            /* Customer & Transaction Info */
            .info-section {
                display: flex;
                gap: 30px;
                margin-bottom: 40px;
            }
            .info-card {
                flex: 1;
                background: var(--bg-light);
                padding: 20px;
                border-radius: 12px;
                border: 1px solid var(--border-subtle);
            }
            .info-card h3 {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--text-light);
                margin: 0 0 12px 0;
            }
            .info-card .primary-text {
                font-size: 16px;
                font-weight: 700;
                color: var(--text-main);
                margin-bottom: 6px;
                line-height: 1.2;
            }
            .info-card .secondary-text {
                font-size: 12px;
                color: var(--text-muted);
                margin: 0;
                line-height: 1.6;
            }

            /* Table */
            table { 
                width: 100%; 
                border-collapse: separate;
                border-spacing: 0;
                margin-bottom: 40px;
            }
            th {
                text-align: left;
                padding: 12px 16px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--text-muted);
                border-bottom: 1px solid var(--border-dark);
                background-color: var(--bg-light);
            }
            th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
            th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
            
            th.right, td.right { text-align: right; }
            th.center, td.center { text-align: center; }
            
            td {
                padding: 16px;
                font-size: 12px;
                color: var(--text-main);
                border-bottom: 1px solid var(--border-subtle);
                vertical-align: middle;
            }
            tr:last-child td {
                border-bottom: 1px solid var(--border-dark);
            }

            .item-name { 
                font-weight: 600; 
                color: var(--text-main);
                font-size: 13px;
                margin-bottom: 4px;
            }
            .item-sku {
                font-size: 10px;
                color: var(--text-light);
                font-weight: 500;
            }
            .item-amount {
                font-family: inherit;
                font-weight: 700;
                font-size: 13px;
            }

            /* Summary */
            .summary-wrapper {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 50px;
            }
            .summary {
                width: 320px;
                background: white;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 16px;
                font-size: 13px;
                color: var(--text-muted);
            }
            .summary-row.sub {
                border-bottom: 1px solid var(--border-subtle);
            }
            .summary-row span.label {
                font-weight: 500;
            }
            .summary-row span.value { 
                color: var(--text-main); 
                font-weight: 600;
                font-family: inherit;
            }
            
            .summary-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--bg-light);
                padding: 20px 16px;
                border-radius: 12px;
                margin-top: 10px;
                border: 1px solid var(--border-dark);
            }
            .summary-total .label {
                font-size: 12px;
                font-weight: 800;
                text-transform: uppercase;
                color: var(--text-main);
                letter-spacing: 0.05em;
            }
            .summary-total .value {
                font-size: 28px;
                font-weight: 800;
                color: var(--accent);
                letter-spacing: -0.02em;
            }

            /* Footer & Fiscal Data */
            .footer {
                position: absolute;
                bottom: 15mm;
                left: 20mm;
                right: 20mm;
                border-top: 1px solid var(--border-dark);
                padding-top: 20px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .fiscal-info {
                max-width: 60%;
            }
            .fiscal-info .terms {
                font-size: 9px;
                color: var(--text-muted);
                line-height: 1.6;
                margin-bottom: 15px;
            }
            .afip-data {
                display: inline-flex;
                align-items: center;
                gap: 15px;
                padding: 12px 20px;
                background: var(--bg-light);
                border: 1px solid var(--border-dark);
                border-radius: 8px;
            }
            .afip-data img {
                height: 30px;
                opacity: 0.8;
            }
            .afip-text {
                font-size: 10px;
                color: var(--text-main);
                line-height: 1.4;
            }
            .afip-text strong {
                font-weight: 700;
            }

            .barcode-section {
                text-align: right;
            }
            .barcode-placeholder {
                font-family: 'Libre Barcode 39', monospace;
                font-size: 46px;
                color: var(--text-main);
                line-height: 1;
                margin-bottom: 4px;
            }
            .barcode-number {
                font-size: 10px;
                font-weight: 600;
                color: var(--text-muted);
                letter-spacing: 0.2em;
            }

            .payment-tag {
                display: inline-block;
                padding: 6px 14px;
                background: white;
                border: 1px solid var(--border-dark);
                border-radius: 20px;
                font-size: 10px;
                font-weight: 700;
                color: var(--text-main);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
    </head>
    <body>
        <div class="invoice-wrapper">
            <div class="watermark">${factura.empresa_nombre_snapshot || 'ERP'}</div>
            
            <div class="content-layer">
                <div class="header">
                    <div class="company-info">
                        <h1>${factura.empresa_nombre_snapshot || 'Sistema ERP'}</h1>
                        <p>${factura.empresa_direccion_snapshot || 'Casa Central'}</p>
                        <p><strong>CUIT/NIF:</strong> ${factura.empresa_nit_snapshot || 'Consumidor Final'}</p>
                        ${factura.empresa_telefono_snapshot ? `<p><strong>Tel:</strong> ${factura.empresa_telefono_snapshot}</p>` : ''}
                    </div>
                    <div class="document-details">
                        <h2>${factura.tipo_comprobante || 'DOCUMENTO'}</h2>
                        <div class="doc-meta">
                            <div class="doc-meta-item">
                                <span class="label">Nº Folio</span>
                                <span class="value">${factura.nro_factura || '0000-00000000'}</span>
                            </div>
                            <div class="doc-meta-item">
                                <span class="label">Fecha Emisión</span>
                                <span class="value">${new Date(factura.fecha_emision || Date.now()).toLocaleDateString('es-AR')}</span>
                            </div>
                            <div class="doc-meta-item">
                                <span class="label">Origen</span>
                                <span class="value">${factura.origen_venta || 'Punto de Venta'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-card">
                        <h3>Facturar a</h3>
                        <div class="primary-text">${factura.cliente_nombre || 'Consumidor Final'}</div>
                        <p class="secondary-text">
                            <strong>Identificación:</strong> ${factura.cliente_doc || '99999999'}<br>
                            Condición IVA: Consumidor Final
                        </p>
                    </div>
                    <div class="info-card" style="flex: 0.7">
                        <h3>Detalles Adicionales</h3>
                        <p class="secondary-text">
                            <strong>Atendido por:</strong><br>
                            ${factura.vendedor_nombre || 'Administrador del Sistema'}<br><br>
                            <strong>Moneda:</strong> ${factura.moneda_id || 'ARS'}
                        </p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th width="45%">Descripción del Ítem</th>
                            <th class="center" width="15%">Cantidad</th>
                            <th class="right" width="20%">Precio Unitario</th>
                            <th class="right" width="20%">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(factura.detalles || []).map((item) => `
                        <tr>
                            <td>
                                <div class="item-name">${item.producto_nombre || item.producto_nombre_snapshot || 'Artículo s/n'}</div>
                                <div class="item-sku">SKU REF-${item.producto_id}</div>
                            </td>
                            <td class="center font-weight-600">${item.cantidad}</td>
                            <td class="right item-amount">$${Number(item.precio_unitario).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                            <td class="right item-amount" style="color: var(--accent)">$${Number(item.subtotal).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="summary-wrapper">
                    <div class="summary">
                        <div class="summary-row sub">
                            <span class="label">Importe Base Neto</span>
                            <span class="value">$${Number(subtotalStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Impuestos / IVA</span>
                            <span class="value">$${Number(impuestosStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                        </div>
                        
                        <div style="text-align: right; padding-right: 16px; margin-top: 5px;">
                            <span class="payment-tag">Medio de Pago: ${factura.metodo_pago || 'No especificado'}</span>
                        </div>

                        <div class="summary-total">
                            <span class="label">Total Operación</span>
                            <span class="value">$${Number(totalStr).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="fiscal-info">
                        <div class="terms">
                            Documento emitido según los términos comerciales acordados. Factura autorizada. 
                            <br>${config.pie_comprobante || 'Agradecemos su preferencia y confianza en nuestros servicios.'}
                        </div>
                        
                        ${factura.afip_cae ? `
                        <div class="afip-data">
                            <!-- Logo genérico AFIP en base64 o SVG para evitar llamadas externas -->
                            <div style="font-size:24px; font-weight:900; color:#3b82f6; letter-spacing:-1px;">afip</div>
                            <div class="afip-text">
                                <strong>CAE N°:</strong> ${factura.afip_cae}<br>
                                <strong>Vencimiento CAE:</strong> ${factura.afip_cae_vto || 'N/A'}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="barcode-section">
                        <div class="barcode-placeholder">*${(factura.nro_factura || '000000').replace(/[^a-zA-Z0-9]/g, '')}*</div>
                        <div class="barcode-number">${(factura.nro_factura || '000000')}</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Intentamos buscar la ruta de Chrome del sistema si estamos en Windows
    let executablePath = null;
    if (process.platform === 'win32') {
        const paths = [
            'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
            'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
            'C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe'
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                executablePath = p;
                break;
            }
        }
    }

    const browserOptions = {
        headless: 'new',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-translate',
            '--disable-extensions'
        ]
    };

    if (executablePath) {
        browserOptions.executablePath = executablePath;
    }

    let browser;
    try {
        browser = await puppeteer.launch(browserOptions);
    } catch (launchError) {
        console.error('[PDFGenerator] Fallo al iniciar Puppeteer:', launchError);
        throw new Error('El motor de PDF no pudo arrancar. Revise si Chrome está instalado.');
    }
    
    try {
        const page = await browser.newPage();
        
        // Emular un device scale más alto para fuentes más nítidas
        await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
        
        await page.setContent(htmlContent, { waitUntil: ['load', 'networkidle0'] });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 } 
        });
        
        return pdfBuffer;
    } catch (pdfError) {
        console.error('[PDFGenerator] Fallo durante renderizado de PDF:', pdfError);
        throw pdfError;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { generateInvoicePDF };
