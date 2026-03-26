// frontend/src/tracing.js
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';

/**
 * Inicializa la observabilidad de forma segura.
 * Se ha simplificado para evitar errores de exportación con Vite.
 */
export const initTracing = () => {
  // Envolver todo en un try-catch global y ejecutar de forma asíncrona
  setTimeout(() => {
    try {
      console.log('[OTel] Iniciando observabilidad (Hotfix v1.27.3.1)...');
      
      const provider = new WebTracerProvider();

      // Verificar si el provider es válido antes de configurar
      if (provider && typeof provider.addSpanProcessor === 'function') {
        const exporter = new OTLPTraceExporter({
          url: import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        });

        provider.addSpanProcessor(new BatchSpanProcessor(exporter));

        provider.register({
          contextManager: new ZoneContextManager(),
        });

        registerInstrumentations({
          instrumentations: [
            new XMLHttpRequestInstrumentation({
              propagateTraceHeaderCorsUrls: [ /.*\/api\/.*/ ],
            }),
            new FetchInstrumentation({
              propagateTraceHeaderCorsUrls: [ /.*\/api\/.*/ ],
            }),
          ],
        });
        
        console.log('[OTel] Observabilidad inicializada correctamente.');
      } else {
        console.warn('[OTel] WebTracerProvider no compatible o mal inicializado. Saltando configuración.');
      }
    } catch (error) {
      // Un fallo aquí no debe romper el renderizado de la aplicación
      console.error('[OTel] Error crítico al inicializar observabilidad:', error);
    }
  }, 100); // Pequeño delay para asegurar que el renderizado de React haya comenzado
};
