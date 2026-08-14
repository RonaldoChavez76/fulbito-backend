/**
 * Archivo: index.js
 * Descripción: Punto de entrada principal de la aplicación Backend de Fulbito.
 *              - Inicializa el servidor Express y el servidor HTTP.
 *              - Configura Socket.io para comunicación en tiempo real (Marcadores en TV).
 *              - Establece middlewares (CORS, JSON Parser).
 *              - Conecta con la base de datos MongoDB usando Mongoose.
 *              - Registra todos los enrutadores (routes) de la API REST.
 */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Cargar variables de entorno desde .env ANTES de cualquier uso de process.env
require('dotenv').config(); 

const matchRoutes = require('./routes/matchRoutes');
const playerRoutes = require('./routes/playerRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const leagueRoutes = require('./routes/leagueRoutes');
const path = require('path');

const app = express();
const server = http.createServer(app);

/**
 * Configuración del servidor Socket.io.
 * Permite conexiones desde cualquier origen (CORS '*').
 */
const io = new Server(server, {
  cors: { origin: '*' }
});

/**
 * Middleware Global: Inyecta la instancia de Socket.io (req.io)
 * en todas las peticiones HTTP, permitiendo a los controladores emitir eventos.
 */
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

// Middlewares estándar
app.use(cors());
app.use(express.json()); // Habilita el parseo de cuerpos JSON en solicitudes (req.body)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Sirve imágenes de manera estática

/**
 * Conexión a MongoDB usando la URI proporcionada en las variables de entorno.
 */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB'))
  .catch((error) => console.error('Error conectando a MongoDB:', error));

// Ruta raíz de comprobación de salud (Health check)
app.get('/', (req, res) => {
  res.send('¡El servidor backend de Fulbito está funcionando correctamente!');
});

// Registro de Rutas
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);

// Iniciar servidor HTTP
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});