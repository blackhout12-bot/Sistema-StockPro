import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperAdmin from '../pages/SuperAdmin';
import AuthContext from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import api from '../utils/axiosConfig';
import moduleRegistry from '../config/moduleRegistry';
import React from 'react';

/**
 * v1.28.2-superadmin-panel-restore-tests
 * Pruebas de UI para el panel de SuperAdmin.
 */

// Mock de dependencias que interactúan con el exterior
vi.mock('../utils/axiosConfig');
vi.mock('../config/moduleRegistry', () => {
  return {
    default: {
      update: vi.fn()
    }
  };
});
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockUpdateFeatureToggles = vi.fn();

const renderComponent = () => {
  return render(
    <AuthContext.Provider value={{ updateFeatureToggles: mockUpdateFeatureToggles }}>
      <BrowserRouter>
        <SuperAdmin />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('SuperAdmin UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el estado de carga inicial', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderComponent();
    expect(screen.getByText(/Cargando plataforma global/i)).toBeInTheDocument();
  });

  it('debe mostrar la lista de empresas obtenida del backend tras la carga', async () => {
    const mockEmpresas = [
      { id: 1, nombre: 'Empresa Alpha', documento_identidad: '123-456', plan_id: 1, plan_nombre: 'Retail Básico' }
    ];
    // Simulamos respuesta exitosa de la API global
    api.get.mockResolvedValue({ data: mockEmpresas });
    
    renderComponent();

    // Verificamos que al menos cargue y deje de mostrar el spinner
    await waitFor(() => {
      expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
    });

    // Verificamos presencia de elementos core
    expect(await screen.findByText(/Empresa Alpha/i)).toBeInTheDocument();
  });

  it('debe actualizar los featureToggles globalmente al cambiar el plan de una empresa', async () => {
    const mockEmpresas = [
      { id: 1, nombre: 'Empresa Test', documento_identidad: '999-999', plan_id: 1, plan_nombre: 'Retail Básico' }
    ];
    api.get.mockResolvedValue({ data: mockEmpresas });
    
    // Mock de la respuesta de cambio de plan (Propagación Full Enterprise)
    api.post.mockResolvedValue({ 
      data: { planId: 5, planNombre: 'Full Enterprise', feature_toggles: ['*'] } 
    });

    renderComponent();

    // Esperar a que la UI se pinte con los datos
    await waitFor(() => expect(screen.getByText('Empresa Test')).toBeInTheDocument());

    // Localizar el selector de plan
    const select = screen.getByRole('combobox');
    
    // Simular cambio al plan ID 5 (v1.28.2 wildcard bypass)
    fireEvent.change(select, { target: { value: '5' } });

    await waitFor(() => {
      // Verificar llamada al backend
      expect(api.post).toHaveBeenCalledWith('/superadmin/changePlan', { empresaId: 1, nuevoPlanId: 5 });
      
      // Verificar PROPAGACIÓN inmediata (Registry + Context)
      expect(moduleRegistry.update).toHaveBeenCalledWith(['*']);
      expect(mockUpdateFeatureToggles).toHaveBeenCalledWith(['*']);
    });
  });

  it('debe mostrar un mensaje de error si el backend falla al cargar las empresas', async () => {
    api.get.mockRejectedValue(new Error('Auth failed'));
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar la plataforma global/i)).toBeInTheDocument();
    });
  });
});
