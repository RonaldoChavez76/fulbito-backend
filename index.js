/**
 * Archivo: index.js
 * Descripción: Inicializa el servidor Express, configura la conexión a MongoDB,
 *              habilita CORS y JSON parsing, y registra las rutas de la API.
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ESTO DEBE IR AQUÍ, ANTES DE USAR PROCESS.ENV
require('dotenv').config(); 

const matchRoutes = require('./routes/matchRoutes');
const playerRoutes = require('./routes/playerRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Para poder recibir JSON en las peticiones

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB'))
  .catch((error) => console.error('Error conectando a MongoDB:', error));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡El servidor está funcionando!');
});

app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/events', eventRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});