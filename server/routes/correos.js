const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configurar el transporte de correo
const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// Ruta para enviar los datos de la tabla por correo
router.post('/enviar', async (req, res) => {
    const { solicitudes } = req.body;

    try {
        if (!solicitudes || !Array.isArray(solicitudes)) {
            return res.status(400).json({ message: 'No hay solicitudes para enviar' });
        }

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

        // Configurar los datos del correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'nelson.guillermo@outlook.com',
            subject: 'Datos de Solicitudes de Materiales',
            html: cuerpoCorreo
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Correo enviado correctamente' });

    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).json({ message: 'Hubo un error al enviar el correo', error: error.message });
    }
});

module.exports = router;
