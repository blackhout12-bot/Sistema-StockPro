import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';

const OnboardingTour = () => {
    const { user, login } = useAuth(); // Usaremos login o un reload para parsear el jwt modificado, pero un state local basta por ahora
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Ejecutar sólo si el usuario existe y su onboarding_completed está false/0
        if (user && user.onboarding_completed === false) {
            // Un pequeño delay para que el DOM termine de renderizarse por completo
            const timer = setTimeout(() => setRun(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const steps = [
        {
            target: 'body',
            content: '👋 ¡Bienvenido a StockPro ERP! Te guiaremos rápidamente por las características clave de tu nueva plataforma empresarial.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#nav-dashboard',
            content: '📊 Aquí verás las métricas globales, como ventas diarias, márgenes y cuentas por cobrar en tiempo real.',
        },
        {
            target: '#nav-facturacion',
            content: '🧾 Desde este módulo puedes emitir Facturas y Tickets POS conectando el catálogo de forma inmediata.',
        },
        {
            target: '#nav-productos',
            content: '📦 Gestiona todo tu inventario en esta sección. Soporta múltiples sucursales, precios dinámicos y lotes de vencimiento.',
        },
        {
            target: '.ml-auto.flex.items-center.gap-1',
            content: '🔔 Finalmente, aquí arriba tienes tu buscador omnicanal y las notificaciones push por quiebre de stock.',
        }
    ];

    const handleJoyrideCallback = async (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            try {
                // Registrar finalización en la Base de Datos
                await api.patch('/auth/me/onboarding');
                toast.success('Onboarding completado. ¡Empieza a operar!');
                
                // Opción 1: Mudar el estado local del contexto sin recargar, 
                // pero refrescar la página es más limpio si se necesita renovar token.
                // localStorage mantendrá el token, pero no tendrá el flag nuevo. No importa.
            } catch (err) {
                console.error('Error reportando finalización del Onboarding:', err);
            }
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#6366f1', // brand-base / indigo-500
                    zIndex: 10000,
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#6366f1',
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
                skip: 'Omitir Tour'
            }}
        />
    );
};

export default OnboardingTour;
