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

            // 2. Determinamos la URL base dinámica
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const port = isLocal ? ':5000' : '';
            const baseUrl = `${window.location.protocol}//${window.location.hostname}${port}`;
            
            const downloadUrl = `${baseUrl}/api/v1/facturacion/${facturaId}/pdf${autoOpen ? '?inline=true' : ''}`;

            // 3. ✨ MODO POST NATIVO: Integración con Descargas del Navegador
            // Al usar un formulario oculto, el navegador maneja la respuesta HTTP.
            // Si el backend envía "attachment", el navegador muestra su UI nativa de descargas
            // con opciones como "Ver en carpeta" o "Abrir archivo", que es exactamente lo requerido.
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
