import React, { useEffect, useState } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';

const TourGuide = ({ setMobileOpen }) => {
  const { user, login } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoria del viewport para evitar re-calculos innecesarios
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Si ya completó el onboarding, no arrancar
    if (user.onboarding_completed) {
      setRun(false);
      return;
    }

    const prefix = isMobile ? '#mobile-tour-' : '#tour-';
    
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
          target: `${prefix}facturacion`,
          content: 'Bases de la Operativa Comercial. Factura y procesa tickets interactuando con el inventario real.',
          title: 'Facturación / POS',
          route: '/facturacion'
        },
        {
          target: `${prefix}sucursales`,
          content: 'Maneja el Multi-Contexto. Con un clic podrás saltar orgánicamente de franquicia base de datos.',
          title: 'Múltiples Sucursales',
          route: '/sucursales'
        },
        {
          target: `${prefix}delegaciones`,
          content: '¿Viaje imprevisto? Transfiere tus atributos gerenciales (Rol Temporal) a un operario en este módulo M:N.',
          title: 'Delegación Organizacional',
          route: '/delegaciones'
        },
        {
          target: `${prefix}auditoria`,
          content: 'Trazabilidad estricta. Entérate de quién ingresó, quién erró la clave, y quién alteró roles.',
          title: 'Auditoría Continua',
          route: '/auditoria'
        },
        {
          target: `${prefix}usuarios`,
          content: 'Gestión de roles asimétricos, políticas de contraseñas y Segundo Factor de Autenticación (MFA/TOTP) para blindar el entorno.',
          title: 'Seguridad y MFA',
          route: '/usuarios',
          disableBeacon: true,
        },
        {
          target: `${prefix}empresa`,
          content: 'Escala y adapta el entorno. Modifica KPIs, Comprobantes o activa Features desde tu consola global.',
          title: 'Configuración Central',
          route: '/empresa'
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
          target: `${prefix}facturacion`,
          content: 'Tu caja registradora o Punto de Venta (TPV). Factura rápido manteniendo el stock pulcro.',
          title: 'Punto de Venta',
          route: '/facturacion'
        },
        {
          target: `${prefix}kardex`,
          content: 'Rastrea en tiempo real el oxígeno de la tienda: Entradas y Salidas al milímetro.',
          title: 'Trazabilidad Física',
          route: '/kardex'
        }
      ];
    }
    
    setSteps(configuredSteps);
    // Permitir un renderizado limpio
    const timer = setTimeout(() => {
        setRun(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [user?.id, user?.onboarding_completed, isMobile]);

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
    } else if (type === EVENTS.STEP_AFTER) {
        const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        
        if (nextIndex >= 0 && nextIndex < steps.length) {
            const nextStep = steps[nextIndex];
            
            // Si el paso objetivo está en el sidebar y estamos en móvil, abrir el menú automáticamente
            if (isMobile && nextStep.target.startsWith('#mobile-tour-')) {
                setMobileOpen(true);
            }

            if (nextStep.route && location.pathname !== nextStep.route) {
                navigate(nextStep.route);
                // Race-condition prevention: esperar un frame para que el router monte el componente
                setTimeout(() => setStepIndex(nextIndex), 50);
            } else {
                setStepIndex(nextIndex);
            }
        }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn(`Joyride: Target ${steps[index].target} not found. Skipping to prevent loop.`);
        // Si no se encuentra, pausamos para que el usuario no vea un crash
        setRun(false);
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
