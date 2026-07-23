/**
 * Archivo: index.js
 * Descripción: Inicializa el servidor Express, configura la conexión a MongoDB,
 *              habilita CORS y JSON parsing, y registra las rutas de la API.
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// ESTO DEBE IR AQUÍ, ANTES DE USAR PROCESS.ENV
require('dotenv').config(); 

const matchRoutes = require('./routes/matchRoutes');
const playerRoutes = require('./routes/playerRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware para inyectar io en todas las peticiones
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado a Socket.io:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Middlewares
app.use(cors());
app.use(express.json()); // Para poder recibir JSON en las peticiones
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir imágenes estáticamente

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
app.use('/api/teams', teamRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});