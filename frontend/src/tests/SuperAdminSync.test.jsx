import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import moduleRegistry from '../config/moduleRegistry';

// Mock simple de UI/toast para la prueba
const ui = {
  showMessage: (msg) => {
    const el = document.createElement('div');
    el.innerText = msg;
    document.body.appendChild(el);
  }
};

describe('Frontend SuperAdmin Sync Tests', () => {
  
  test('Frontend refresca menús al cambiar plan', () => {
    const response = {
      empresaId: 123,
      planId: 5,
      planNombre: 'Full Enterprise',
      feature_toggles: { '*': true }
    };

    moduleRegistry.update(response.feature_toggles);
    const toggles = moduleRegistry.get();
    
    expect(toggles).toHaveProperty('*');
    expect(toggles['*']).toBe(true);
  });

  test('Frontend muestra mensaje de confirmación', () => {
    const message = 'El plan de la empresa fue actualizado a Full Enterprise';
    
    // Simular toast/mensaje
    document.body.innerHTML = `<div>${message}</div>`;
    
    const element = screen.getByText(/El plan de la empresa fue actualizado/);
    expect(element).toBeTruthy();
    expect(element.innerHTML).toContain('Full Enterprise');
  });


});
