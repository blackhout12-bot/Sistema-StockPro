import React, { useEffect, useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';

const TourGuide = () => {
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
    let configuredSteps = [];
    
    if (['admin', 'gerente'].includes(user.rol)) {
      configuredSteps = [
        {
          target: 'body',
          placement: 'center',
          content: 'Bienvenido al panel táctico de TB Gestión. Exploremos las entrañas operativas.',
          title: 'Sistema ERP'
        },
        {
          target: '#tour-usuarios',
          content: 'Desde aquí gobernarás los Perfiles, Accesos y la habilitación de Doble Factor de Seguridad.',
          title: 'Gestor de Permisos'
        },
        {
          target: '#tour-delegaciones',
          content: '¿Viaje imprevisto? Transfiere tus atributos gerenciales (Rol Temporal) a un operario en este módulo M:N.',
          title: 'Delegación Organizacional'
        },
        {
          target: '#tour-sucursales',
          content: 'Maneja el Multi-Contexto. Con un clic en la barra superior o aquí podrás saltar orgánicamente de franquicia.',
          title: 'Matriz Multi-Tenant'
        }
      ];
    } else {
      configuredSteps = [
        {
          target: 'body',
          placement: 'center',
          content: 'Comienza tu turno en TB ERP. Te mostraremos las herramientas esenciales.',
          title: 'Panel Operativo'
        },
        {
          target: '#tour-facturacion',
          content: 'Tu caja registradora o Punto de Venta (TPV). Factura rápido manteniendo el stock pulcro.',
          title: 'Punto de Venta'
        },
        {
          target: '#tour-kardex',
          content: 'Rastrea en tiempo real el oxígeno de la tienda: Entradas y Salidas al milímetro.',
          title: 'Trazabilidad Física'
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
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    // Si el usuario termina el paseo o lo saltea, llamar a Backend
    if (finishedStatuses.includes(status)) {
      setRun(false);
      try {
        await api.patch('/auth/me/onboarding');
        // Actualizar state in situ para evitar reinicio
        login({ token: localStorage.getItem('token'), user: { ...user, onboarding_completed: true } });
      } catch (err) {
        console.error('Fallo marcando UX complete', err);
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
