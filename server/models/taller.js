const mongoose = require('mongoose');

const TallerSchema = new mongoose.Schema({
    nombreTaller: { type: String, required: true },
    nombreEncargado: { type: String, required: true },
    correoEncargado: { type: String, required: true },
    solicitudes: [
        {
            materiales: [
                {
                    nombre: { type: String, required: true },
                    cantidad: { type: Number, required: true },
                    estado: { type: String, enum: ['Solicitado', 'Entregado', 'Devuelto'], default: 'Solicitado' },
                    fecha: { type: Date, default: Date.now }
                }
            ]
        }
    ]
});

const Taller = mongoose.model('Taller', TallerSchema, 'talleres');
module.exports = Taller;