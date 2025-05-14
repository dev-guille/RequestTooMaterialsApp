const express = require('express');
const router = express.Router();
const Taller = require('../models/taller');


// Obtener todos los talleres
router.get('/', async (req, res) => {
    try {
        const talleres = await Taller.find();
        res.json(talleres);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los talleres', error: error.message });
    }
});

// Obtener un solo taller por su ID
router.get('/:id', async (req, res) => {
    try {
        const taller = await Taller.findById(req.params.id);
        if (!taller) {
            return res.status(404).json({ message: 'Taller no encontrado' });
        }
        res.json(taller);
    } catch (error) {
        console.error('Error al obtener el taller por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID no válido', error: error.message });
        }
        res.status(500).json({ message: 'Error al obtener el taller', error: error.message });
    }
});

// Crear un nuevo taller
router.post('/', async (req, res) => {
    const { nombreTaller, nombreEncargado, correoEncargado } = req.body;
    if (!nombreTaller || !nombreEncargado || !correoEncargado) {
        return res.status(400).json({ message: 'El nombre del taller, el nombre del encargado y el correo del encargado son requeridos' });
    }
    try {
        const nuevoTaller = new Taller({ nombreTaller, nombreEncargado, correoEncargado });
        await nuevoTaller.save();
        res.status(201).json({ message: 'Taller creado exitosamente', taller: nuevoTaller });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el taller', error: error.message });
    }
});


// Agregar una solicitud de materiales a un taller
router.post('/:id/solicitud', async (req, res) => {
    const { id } = req.params;
    const { materiales } = req.body;

    // Validación de que los materiales son correctos
    if (!materiales || !Array.isArray(materiales) || materiales.length === 0) {
        return res.status(400).json({ message: 'Se requiere una lista de materiales' });
    }

    try {
        // Buscar el taller
        const taller = await Taller.findById(id);
        if (!taller) {
            return res.status(404).json({ message: 'Taller no encontrado' });
        }

        // Obtener el encargado directamente del taller
        const encargado = taller.nombreEncargado;

        // Crear una nueva solicitud con los materiales
        const nuevaSolicitud = {
            encargado,
            materiales
        };

        // Añadir la nueva solicitud al taller
        taller.solicitudes.push(nuevaSolicitud);
        await taller.save();

        res.json({ message: 'Solicitud agregada correctamente', taller });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar la solicitud', error: error.message });
    }
});

// Actualizar el estado de un material dentro de una solicitud
router.put('/:id/solicitud/:solicitudIndex/material/:materialIndex', async (req, res) => {
    const { id, solicitudIndex, materialIndex } = req.params;
    const { nuevoEstado } = req.body;

    try {
        const taller = await Taller.findById(id);
        if (!taller) {
            return res.status(404).json({ message: 'Taller no encontrado' });
        }

        const solicitud = taller.solicitudes[solicitudIndex];
        if (!solicitud) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        const material = solicitud.materiales[materialIndex];
        if (!material) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        material.estado = nuevoEstado;
        await taller.save();

        res.json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado', error: error.message });
    }
});



// Eliminar un material por su ID
router.delete('/:tallerId/solicitud/:solicitudIndex/material/:materialIndex', async (req, res) => {
    const { tallerId, solicitudIndex, materialIndex } = req.params;

    try {
        const taller = await Taller.findById(tallerId);
        if (!taller) return res.status(404).json({ message: 'Taller no encontrado' });

        const solicitud = taller.solicitudes[solicitudIndex];
        if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });

        if (!solicitud.materiales[materialIndex]) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        solicitud.materiales.splice(materialIndex, 1); // Eliminar material
        await taller.save();

        res.json({ message: 'Material eliminado correctamente', taller });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el material', error: error.message });
    }
});




module.exports = router;
