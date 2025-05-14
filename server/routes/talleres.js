const express = require('express');
const router = express.Router();
const Taller = require('../models/taller');
const nodemailer = require('nodemailer');

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




// Configura el transporte de correo
const transporter = nodemailer.createTransport({
    service: 'outlook', // O el servicio que uses
    auth: {
        user: process.env.EMAIL_USER, // Correo de origen
        pass: process.env.EMAIL_PASS, // Contraseña del correo de origen
    }
});

// Ruta para enviar los datos de la tabla por correo
router.post('/:id/enviar-correo', async (req, res) => {
    const { solicitudes } = req.body;

    // Buscar el taller
        const taller = await Taller.findById(id);
        if (!taller) {
            return res.status(404).json({ message: 'Taller no encontrado' });
        }

        // Obtener el encargado directamente del taller
        const correo = taller.correoEncargado;

    if (!solicitudes || !Array.isArray(solicitudes)) {
        return res.status(400).json({ message: 'No hay solicitudes para enviar' });
    }

    // Crear el cuerpo del correo con los datos de la tabla
    /* let cuerpoCorreo = 'Solicitudes de Materiales:\n\n';
    solicitudes.forEach(solicitud => {
        cuerpoCorreo += `Material: ${solicitud.material}\nCantidad: ${solicitud.cantidad}\nEstado: ${solicitud.estado}\n\n`;
    }); */
    // Crear el cuerpo del correo con los datos de la tabla en formato HTML
        // Crear el cuerpo del correo con los datos de la tabla en formato HTML
        let cuerpoCorreo = `
        <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f7fa;
                        color: #333;
                        margin: 20px;
                        padding: 0;
                    }
                    h1 {
                        color: #4CAF50;
                        text-align: center;
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        max-width: 800px;
                        margin: 0 auto;
                        border-collapse: collapse;
                        background-color: #fff;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    th, td {
                        padding: 12px 15px;
                        text-align: left;
                        border: 1px solid #ddd;
                    }
                    th {
                        background-color: #4CAF50;
                        color: white;
                        font-size: 16px;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    tr:hover {
                        background-color: #f1f1f1;
                    }
                    td {
                        font-size: 14px;
                        color: #555;
                    }
                    .estado {
                        font-weight: bold;
                        text-transform: capitalize;
                    }
                    .estado.solicitado {
                        color: #f39c12;
                    }
                    .estado.entregado {
                        color: #27ae60;
                    }
                    .estado.devuelto {
                        color: #e74c3c;
                    }
                    .footer {
                        text-align: center;
                        font-size: 12px;
                        color: #888;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <h1>Solicitudes de Materiales</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>`;

        solicitudes.forEach(solicitud => {
        cuerpoCorreo += `
            <tr>
                <td>${solicitud.material}</td>
                <td>${solicitud.cantidad}</td>
                <td class="estado ${solicitud.estado.toLowerCase()}">${solicitud.estado}</td>
            </tr>`;
        });

        cuerpoCorreo += `
                    </tbody>
                </table>
                <div class="footer">
                    <p>Este correo fue generado automáticamente. No responda.</p>
                </div>
            </body>
        </html>`;


    // Enviar el correo
    try {
         // Configurar los datos del correo
        const mailOptions = {
            from: process.env.EMAIL_USER,  // Correo de origen
            //to: 'nelson.guillermo@outlook.com',   // Correo del encargado (puedes usar la variable que quieras)
            to: correo,
            subject: 'Datos de Solicitudes de Materiales',
            /* text: cuerpoCorreo */
            html: cuerpoCorreo // Aquí se utiliza el cuerpo con formato HTML

        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Correo enviado correctamente' });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).json({ message: 'Hubo un error al enviar el correo', error: error.message });
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
