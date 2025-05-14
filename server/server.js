require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('📌 Conectado a MongoDB'))
  .catch(err => console.log(err));

// Ruta para manejar GET en la raíz
app.get('/', (req, res) => {
    res.send('Bienvenido a la API');
});

// Importamos rutas
const talleresRoutes = require('./routes/talleres');
app.use('/api/talleres', talleresRoutes);

app.listen(3000, () => console.log('✅ Servidor corriendo en https://requesttoomaterialsapp.onrender.com/'));
//app.listen(3000, () => console.log('✅ Servidor corriendo en http://localhost:3000'));
