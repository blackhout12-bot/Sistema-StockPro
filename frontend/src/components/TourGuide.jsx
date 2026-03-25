import React, { useEffect, useState } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';

/**
 * TourGuide — Onboarding Joyride
 * 
 * REGLAS DE DISEÑO (v1.27.2.7):
 * - Todos los targets usan IDs #tour-{id} (sidebar desktop siempre visible).
 * - NO se navega programáticamente entre rutas. El sidebar muestra todos los
 *   módulos sin importar la ruta activa, por lo tanto los targets ya existen en DOM.
 * - isMobile se ignora: los IDs son unificados para desktop y mobile.
 * - skipMissingSteps={true} para no bloquearse si un módulo no está habilitado.
 */
const TourGuide = ({ setMobileOpen }) => {
  const { user, login } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Si ya completó el onboarding, no arrancar
    if (user.onboarding_completed) {
      setRun(false);
      return;
    }

    // Configuración condicional según el rol jerárquico
    // IMPORTANTE: todos los targets apuntan al sidebar — siempre está montado.
    let configuredSteps = [];

    if (['admin', 'gerente'].includes(user.rol)) {
      configuredSteps = [
        {
          target: 'body',
          placement: 'center',
          content: 'Bienvenido al panel táctico de TB Gestión. Exploremos las entrañas operativas.',
          title: '🏢 Sistema ERP',
          disableBeacon: true,
        },
        {
          target: '#tour-facturacion',
          content: 'Bases de la Operativa Comercial. Factura y procesa tickets interactuando con el inventario real.',
          title: '🧾 Facturación / POS',
        },
        {
          target: '#tour-productos',
          content: 'Catálogo centralizado de productos con imágenes, lotes y precios por sucursal.',
          title: '📦 Catálogo de Productos',
        },
        {
          target: '#tour-sucursales',
          content: 'Maneja el Multi-Contexto. Con un clic podrás saltar orgánicamente de franquicia.',
          title: '🏪 Múltiples Sucursales',
        },
        {
          target: '#tour-delegaciones',
          content: '¿Viaje imprevisto? Transfiere tus atributos gerenciales (Rol Temporal) a un operario en este módulo M:N.',
          title: '🤝 Delegación Organizacional',
        },
        {
          target: '#tour-auditoria',
          content: 'Trazabilidad estricta. Entérate de quién ingresó, quién erró la clave, y quién alteró roles.',
          title: '🔍 Auditoría Continua',
        },
        {
          target: '#tour-usuarios',
          content: 'Gestión de roles asimétricos, políticas de contraseñas y MFA/TOTP para blindar el entorno.',
          title: '🔐 Seguridad y MFA',
        },
        {
          target: '#tour-empresa',
          content: 'Escala y adapta el entorno. Modifica KPIs, Comprobantes o activa Features desde tu consola global.',
          title: '⚙️ Configuración Central',
        }
      ];
    } else {
      configuredSteps = [
        {
          target: 'body',
          placement: 'center',
          content: 'Comienza tu turno en TB ERP. Te mostraremos las herramientas esenciales.',
          title: '🏪 Panel Operativo',
          disableBeacon: true,
        },
        {
          target: '#tour-facturacion',
          content: 'Tu caja registradora o Punto de Venta (TPV). Factura rápido manteniendo el stock pulcro.',
          title: '🧾 Punto de Venta',
        },
        {
          target: '#tour-productos',
          content: 'Consulta el catálogo de productos con stock en tiempo real.',
          title: '📦 Catálogo',
        },
        {
          target: '#tour-kardex',
          content: 'Rastrea en tiempo real el oxígeno de la tienda: Entradas y Salidas al milímetro.',
          title: '📊 Trazabilidad Física',
        }
      ];
    }

    setSteps(configuredSteps);

    // Retardo de 1s para que el MainLayout termine de renderizar los nodos #id del sidebar
    const timer = setTimeout(() => {
      setRun(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user?.id, user?.onboarding_completed]);

  const handleJoyrideCallback = async (data) => {
    const { status, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    // Registrar inicio del tour en auditoría
    if (type === EVENTS.TOUR_START) {
      try {
        await api.post('/auth/me/onboarding/start');
      } catch (e) {
        console.error('Error auditando inicio del tour', e);
      }
    }

    // Si el usuario termina el paseo o lo saltea, marcar en backend
    if (finishedStatuses.includes(status)) {
      setRun(false);
      try {
        await api.patch('/auth/me/onboarding');
        // Actualizar state in situ para evitar reinicio del tour
        login({ token: localStorage.getItem('token'), user: { ...user, onboarding_completed: true } });
      } catch (err) {
        console.error('Fallo marcando onboarding completo', err);
      }
    }
  };

  if (!run) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      skipMissingSteps={true}
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5',
          textColor: '#333333',
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '16px'
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
          borderRadius: '8px'
        },
        buttonBack: {
          marginRight: 10
        }
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Omitir'
      }}
    />
  );
};

export default TourGuide;
