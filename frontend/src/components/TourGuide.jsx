import React, { useEffect, useState } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';

const TourGuide = () => {
  const { user, login } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    
    // Si ya completó el onboarding, no arrancar
    if (user.onboarding_completed) {
      setRun(false);
      return;
    }

    // Configuración condicional según el rol jerárquico
    let configuredSteps = [];
    
    if (['admin', 'gerente'].includes(user.rol)) {
      configuredSteps = [
        {
          target: 'body',
          placement: 'center',
          content: 'Bienvenido al panel táctico de TB Gestión. Exploremos las entrañas operativas.',
          title: 'Sistema ERP',
          route: '/'
        },
        {
          target: '#tour-facturacion',
          content: 'Bases de la Operativa Comercial. Factura y procesa tickets interactuando con el inventario real.',
          title: 'Facturación / POS',
          route: '/facturacion'
        },
        {
          target: '#tour-sucursales',
          content: 'Maneja el Multi-Contexto. Con un clic podrás saltar orgánicamente de franquicia base de datos.',
          title: 'Múltiples Sucursales',
          route: '/sucursales'
        },
        {
          target: '#tour-delegaciones',
          content: '¿Viaje imprevisto? Transfiere tus atributos gerenciales (Rol Temporal) a un operario en este módulo M:N.',
          title: 'Delegación Organizacional',
          route: '/delegaciones'
        },
        {
          target: '#tour-auditoria',
          content: 'Trazabilidad estricta. Entérate de quién ingresó, quién erró la clave, y quién alteró roles.',
          title: 'Auditoría Continua',
          route: '/auditoria'
        },
        {
          target: '.ml-auto.flex.items-center.gap-1',
          content: 'Desde la barra superior asegurarás la integridad de tu sesión (MFA) operando con máxima jerarquía.',
          title: 'Seguridad Avanzada',
          route: '/'
        }
      ];
    } else {
      configuredSteps = [
        {
          target: 'body',
          placement: 'center',
          content: 'Comienza tu turno en TB ERP. Te mostraremos las herramientas esenciales.',
          title: 'Panel Operativo',
          route: '/'
        },
        {
          target: '#tour-facturacion',
          content: 'Tu caja registradora o Punto de Venta (TPV). Factura rápido manteniendo el stock pulcro.',
          title: 'Punto de Venta',
          route: '/facturacion'
        },
        {
          target: '#tour-kardex',
          content: 'Rastrea en tiempo real el oxígeno de la tienda: Entradas y Salidas al milímetro.',
          title: 'Trazabilidad Física',
          route: '/kardex'
        }
      ];
    }
    
    setSteps(configuredSteps);
    // Un leve retraso permite que el MainLayout termine de renderizar los nodos #id
    setTimeout(() => {
        setRun(true);
    }, 1000);
  }, [user]);

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    // Si el usuario termina el paseo o lo saltea, llamar a Backend
    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0);
      try {
        await api.patch('/auth/me/onboarding');
        // Actualizar state in situ para evitar reinicio
        login({ token: localStorage.getItem('token'), user: { ...user, onboarding_completed: true } });
        // Retornar al dashboard para que no quede en rutas sueltas si abandonó a medias
        navigate('/');
      } catch (err) {
        console.error('Fallo marcando UX complete', err);
      }
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        // Paginación Manual + React Router
        const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        if (nextStepIndex >= 0 && nextStepIndex < steps.length) {
            setStepIndex(nextStepIndex);
            const route = steps[nextStepIndex].route;
            if (route && location.pathname !== route) {
                navigate(route);
            }
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
      stepIndex={stepIndex}
      scrollToFirstStep
      showProgress
      showSkipButton
      skipMissingSteps={false}
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#000000',
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
