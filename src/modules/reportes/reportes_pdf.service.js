const puppeteer = require('puppeteer');
const kardexRepo = require('../../repositories/kardex.repository');
const { connectDB } = require('../../config/db');

class ReportesPDFService {

    async generarKardexPdf(empresa_id, empresa_nombre = 'Mi Empresa') {
        const pool = await connectDB();
        const resumen = await kardexRepo.getResumenValorizado(pool, empresa_id);
        const totalCapital = resumen.reduce((acc, r) => acc + (r.valor_total || 0), 0);

        // Construir el HTML con Tailwind CSS (vía CDN para render rápido en pdf)
        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Kardex Valorizado</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-white p-10 font-sans text-slate-800">
            <div class="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 class="text-4xl font-black tracking-tighter text-slate-900">Kardex Valorizado</h1>
                    <p class="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">${empresa_nombre}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha de Emisión</p>
                    <p class="text-lg font-mono font-black text-slate-800">${new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 flex justify-between items-center">
                <div>
                    <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Capital Inmovilizado Estimado</p>
                    <p class="text-3xl font-black font-mono text-slate-900">$${Number(totalCapital).toLocaleString('es-AR')}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs font-black text-slate-500 uppercase tracking-widest">SKUs Activos</p>
                    <p class="text-3xl font-black font-mono text-slate-900">${resumen.length}</p>
                </div>
            </div>

            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                        <th class="py-3 px-4 rounded-tl-lg font-bold">Código SKU</th>
                        <th class="py-3 px-4 font-bold">Descripción</th>
                        <th class="py-3 px-4 text-center font-bold">Stock Físico</th>
                        <th class="py-3 px-4 text-right font-bold">Costo Unit. Promedio</th>
                        <th class="py-3 px-4 text-right rounded-tr-lg font-bold">Valorización Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
        `;

        resumen.forEach((r, idx) => {
            const bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
            html += `
                    <tr class="${bgClass} hover:bg-slate-100 transition-colors">
                        <td class="py-3 px-4 font-mono text-slate-500 font-medium">SKU-${r.producto_id}</td>
                        <td class="py-3 px-4 font-bold text-slate-800">${r.nombre}</td>
                        <td class="py-3 px-4 text-center font-mono font-black">${r.stock}</td>
                        <td class="py-3 px-4 text-right font-mono text-slate-600">$${Number(r.ultimo_costo || 0).toLocaleString('es-AR')}</td>
                        <td class="py-3 px-4 text-right font-mono font-black text-slate-900">$${Number(r.valor_total).toLocaleString('es-AR')}</td>
                    </tr>
            `;
        });

        html += `
                </tbody>
            </table>

            <div class="mt-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                Documento generado automáticamente por StockPro ERP
            </div>
        </body>
        </html>
        `;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();
        return pdfBuffer;
    }
}

module.exports = new ReportesPDFService();
