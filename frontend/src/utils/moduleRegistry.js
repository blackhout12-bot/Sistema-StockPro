/**
 * Utility to manage dynamic feature toggle updates across the application.
 * v1.28.2-superadmin-plan-propagation
 */
export const moduleRegistry = {
  /**
   * Updates the current session's feature toggles and triggers a UI sync.
   * @param {Object} feature_toggles - The new set of feature toggles.
   */
  update: (feature_toggles) => {
    if (!feature_toggles) return;
    
    // Dispatch event to AuthContext to update state and localStorage
    window.dispatchEvent(new CustomEvent('plan-sync-required', { 
      detail: { feature_toggles } 
    }));
  }
};

export default moduleRegistry;
