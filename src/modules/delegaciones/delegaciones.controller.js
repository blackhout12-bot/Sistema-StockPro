const express = require('express');
const router = express.Router();
const delegacionesModel = require('./delegaciones.model');
const audit = require('../../middlewares/audit');
const { checkPermiso } = require('../../middlewares/auth');

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
router.post('/', audit('crear_delegacion', 'Delegaciones'), async (req, res) => {
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

// Revocar Asignación
router.put('/:id/revocar', audit('revocar_delegacion', 'Delegaciones'), async (req, res) => {
    try {
        const revocada = await delegacionesModel.revoke(req.params.id, req.user.id);
        res.json({ message: 'Delegación revocada permanentemente', data: revocada });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
});

module.exports = router;
