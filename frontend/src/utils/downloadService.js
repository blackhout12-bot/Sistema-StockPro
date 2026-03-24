/**
 * Servicio avanzado para descargas de archivos en React, diseñado para
 * sortear restricciones de seguridad (sandboxing) en navegadores modernos (Chrome/Edge/Safari).
 * Implementa la API 'File System Access' con un fallback ultra robusto de Blobs persistentes.
 */
export const DownloadService = {
    /**
     * Descarga y guarda de forma segura un PDF generado en el backend.
     * @param {string|number} facturaId ID de la factura
     * @param {string} nroFactura Folio de la factura para nombre del archivo
     * @param {boolean} autoOpen Si es true, abre el documento en nueva pestaña
     * @param {Object} toast referncia a react-hot-toast para UI
     */
    downloadPDF: (facturaId, nroFactura, autoOpen = false, toast) => {
        const toastId = `pdf-${facturaId}`;
        try {
            if (toast) toast.loading(autoOpen ? 'Abriendo documento...' : 'Iniciando descarga nativa...', { id: toastId });
            
            // 1. Obtenemos credenciales del LocalStorage
            const token = localStorage.getItem('token');
            const selectedEmp = JSON.parse(localStorage.getItem('selectedEmpresa') || '{}');
            const userObj = JSON.parse(localStorage.getItem('user') || '{}');
            const empId = selectedEmp.id || userObj.empresa_id || '';

            // 2. Determinamos la URL. Usamos la variable de entorno o resolvemos como ruta relativa
            // Al usar una ruta relativa, el Proxy de Vite (dev) o el Nginx (prod) absorben el ruteo sin hardcodear puertos.
            const baseUrl = typeof process !== 'undefined' && process.env && process.env.VITE_API_URL 
                ? process.env.VITE_API_URL 
                : '/api/v1';
            
            const downloadUrl = `${baseUrl}/facturacion/${facturaId}/pdf${autoOpen ? '?inline=true' : ''}`;

            // 3. MODO POST NATIVO: Integración con Descargas del Navegador
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = downloadUrl;
            
            // Si es auto-open, lo lanzamos en nueva pestaña para no cerrar la app actual
            if (autoOpen) form.target = '_blank';
            form.style.display = 'none';

            // Campo Token Oculto
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'token';
            tokenInput.value = token || '';
            form.appendChild(tokenInput);

            // Campo Empresa ID Oculto
            const empInput = document.createElement('input');
            empInput.type = 'hidden';
            empInput.name = 'empresa_id';
            empInput.value = empId;
            form.appendChild(empInput);

            // 4. Inyección, Envío y Limpieza
            document.body.appendChild(form);
            form.submit();
            
            setTimeout(() => {
                if (document.body.contains(form)) {
                    document.body.removeChild(form);
                }
            }, 1000);
            
            if (toast) {
                toast.success(
                    autoOpen ? 'Documento abierto' : 'Descarga enviada al navegador. Revisa tus notificaciones.', 
                    { id: toastId }
                );
            }
        } catch (err) {
            console.error('[DownloadService] Error POST Native PDF:', err);
            const msg = err.message || 'Error al solicitar el documento PDF';
            if (toast) toast.error(msg, { id: toastId });
        }
    }
};
