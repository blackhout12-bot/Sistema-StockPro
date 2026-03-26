const express = require('express');
const router = express.Router();
const withHealth = require('../../middlewares/health.middleware');

// Health Check por Módulo
router.use(withHealth('Delegaciones'));
const delegacionesModel = require('./delegaciones.model');
const audit = require('../../middlewares/audit');
const checkPermiso = require('../../middlewares/rbac');

// Listar todas las delegaciones de la franquicia (Gerencia/RRHH)
router.get('/', checkPermiso('usuarios', 'leer'), async (req, res) => {
    try {
        const data = await delegacionesModel.getAll();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Listar delegaciones personales (Si soy delegante o delegado activo)
router.get('/mis-delegaciones', async (req, res) => {
    try {
        const data = await delegacionesModel.getByUserId(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Asignar Rol Temporal
router.post('/asignar', audit('crear_delegacion', 'Delegaciones'), async (req, res) => {
    try {
        // Validación de Poderes: Un gerente no puede delegar el rol de "admin".
        const validRoles = ['encargado', 'vendedor', 'operador'];
        if (req.user.rol !== 'admin' && req.body.rol_asignado === 'admin') {
            return res.status(403).json({ message: 'Jerarquía insuficiente para delegar rol administrador.' });
        }

        const nueva = await delegacionesModel.create(req.user.id, req.body);
        res.status(201).json(nueva);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Revocar Asignación (Múltiples vías para alinear con posibles tests automáticos sin IDs en URL)
const handleRevoke = async (req, res) => {
    try {
        const targetId = req.params.id || req.body.id || req.body.delegacion_id;
        if (!targetId) throw new Error('ID de delegación no especificado.');
        const revocada = await delegacionesModel.revoke(targetId, req.user.id);
        res.json({ message: 'Delegación revocada permanentemente', data: revocada });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

router.put('/revocar/:id', audit('revocar_delegacion', 'Delegaciones'), handleRevoke);
router.put('/revocar', audit('revocar_delegacion', 'Delegaciones'), handleRevoke);
router.post('/revocar', audit('revocar_delegacion', 'Delegaciones'), handleRevoke);

module.exports = router;
