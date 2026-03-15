const express = require('express');
const router = express.Router();
const ssoController = require('./sso.controller');

// GET /api/v1/auth/sso/:provider - Iniciar flujo (Mock para redirección)
router.get('/:provider', (req, res) => {
    const { provider } = req.params;
    // En producción redirigiría a login.microsoftonline.com o accounts.google.com
    res.json({ message: `Redirigiendo a portal SSO de ${provider}` });
});

// POST /api/v1/auth/sso/:provider/callback - Retorno con Token JWT de Google/MS
router.post('/:provider/callback', ssoController.handleOAuthCallback.bind(ssoController));

module.exports = router;
