# Servidor Backend - Fulbito 360

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" />
</p>

El servidor **Backend de Fulbito 360** actúa como el núcleo central de toda la plataforma distribuida. Está construido sobre Node.js y diseñado para manejar peticiones asíncronas RESTful y conexiones persistentes WebSocket bidireccionales en tiempo real. 

Su función principal es orquestar la comunicación entre el **Reloj Inteligente del Árbitro**, los **Teléfonos de los Administradores** y los **Marcadores Android TV**, al mismo tiempo que persiste los datos en una base de datos no relacional alojada en MongoDB.

---

## Patrones Arquitectónicos

El backend está diseñado utilizando una estricta **Arquitectura MVC (Model-View-Controller)** adaptada a API REST. Las vistas (Views) son reemplazadas por las respuestas JSON enviadas a las aplicaciones Android.

* **Patrón Singleton:** Utilizado para la conexión a MongoDB y la instanciación global del servidor Socket.io inyectado por Middleware.
* **Sistema de Enrutamiento (Router Pattern):** Separación modular de endpoints usando `express.Router()`.
* **Middlewares de Intercepción:** Control de subida de imágenes (Multer) y validación de Seguridad (JWT Bearer Token) que actúan como guardianes antes de acceder al controlador.

---

## Estructura Exacta del Proyecto Backend (Árbol de Carpetas)

A continuación, la estructura técnica real de los directorios y archivos de la lógica de servidor:

```text
fulbito-backend/
├── config/
│   └── db.js                        (Script de inicialización para MongoDB)
├── controllers/                     (Capa de Lógica de Negocio)
│   ├── authController.js            (Lógica de registro e inicio de sesión)
│   ├── eventController.js           (CRUD de eventos de goles/tarjetas)
│   ├── leagueController.js          (Gestión de torneos)
│   ├── matchController.js           (Motor de partidos y emisión de Sockets)
│   ├── playerController.js          (CRUD de jugadores y actualización de stats)
│   ├── teamController.js            (Creación de equipos)
│   └── uploadController.js          (Servicio procesador de imágenes)
├── middlewares/                     (Capa de Intercepción)
│   ├── authMiddleware.js            (Verificación criptográfica de Tokens JWT)
│   └── uploadMiddleware.js          (Configuración de Multer para Multipart form-data)
├── models/                          (Capa de Datos Mongoose - Esquemas)
│   ├── Event.js                     
│   ├── League.js                    
│   ├── Match.js                     
│   ├── Player.js                    
│   ├── Team.js                      
│   └── User.js                      
├── routes/                          (Capa de Enrutamiento API REST)
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── leagueRoutes.js
│   ├── matchRoutes.js
│   ├── playerRoutes.js
│   ├── teamRoutes.js
│   └── uploadRoutes.js
├── uploads/                         (Carpeta pública para persistencia de imágenes)
├── create_admin.js                  (Script semilla / CLI para generar super-usuarios)
├── index.js                         (Punto de entrada principal del clúster Express)
├── package.json
└── README.md
```

---

## Función y Detalle de Todos los Archivos Críticos del Backend

### Capa de Datos (Modelos Mongoose)
| Archivo | Ubicación | Descripción / Función Principal |
|---------|-----------|--------------------------------|
| `Match.js` | `models/` | Define el esquema del Partido, incluyendo marcadores, estado (en juego, pausa) y el cronómetro. Mantiene referencias ObjectId hacia Equipos. |
| `Player.js` | `models/` | Estructura que acumula de forma agregada los goles, partidos jugados y tarjetas. Pieza fundamental para dibujar el radar en el móvil. |
| `User.js` | `models/` | Esquema del usuario del sistema. Requiere que la contraseña se encripte mediante bcrypt *antes* de ser guardada usando hooks (`pre-save`). |
| `db.js` | `config/` | Configura la URL de conexión a Mongo y gestiona la reconexión automática en caso de caída del clúster local/cloud. |

### Capa de Intercepción y Rutas
| Archivo | Ubicación | Descripción / Función Principal |
|---------|-----------|--------------------------------|
| `authMiddleware.js` | `middlewares/` | Extrae el header `Authorization: Bearer <token>`, lo decodifica y adjunta el ID del usuario desencriptado al objeto `req`. |
| `uploadMiddleware.js`| `middlewares/` | Utiliza la librería `multer`. Analiza los bytes entrantes, renombra los archivos con `Date.now()` para evitar colisiones y los guarda en `/uploads`. |
| `matchRoutes.js` | `routes/` | Expone los endpoints `POST /api/matches` y `PUT /api/matches/:id`. Algunos están protegidos por el Middleware de autenticación. |

### Capa de Lógica de Negocio (Controladores)
| Archivo | Ubicación | Descripción / Función Principal |
|---------|-----------|--------------------------------|
| `index.js` | Raíz | Inicializa el servidor `HTTP`, el servidor de `Socket.io`, aplica CORS, parseo JSON, y monta todos los routers. |
| `matchController.js`| `controllers/`| Lógica ultra-crítica. Guarda eventos en base de datos e inmediatamente dispara `req.io.emit('match_updated')` hacia los Androids. |
| `authController.js` | `controllers/`| Autentica al usuario comparando hashes bcrypt. Si es válido, firma un token JWT usando una clave secreta y un tiempo de expiración. |
| `uploadController.js`| `controllers/`| Recibe el archivo previamente filtrado por Multer y genera una URL pública accesible desde Internet para que Android la consuma con `Coil`. |

---

## Código y Lógica Principal (Extractos Completos y Funcionales)

A continuación se presentan los fragmentos de código más representativos de la lógica del lado del servidor.

### 1. Inicialización de Servidor y WebSockets (index.js)
El corazón del backend. Fusionamos el protocolo HTTP tradicional con la actualización en tiempo real de WebSockets, inyectando `io` directamente en la cadena de Middlewares de Express para que los controladores puedan emitir eventos.
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware global para inyectar Socket.io en el Request (req.io)
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log('Cliente Android conectado a Socket.io:', socket.id);
  socket.on('disconnect', () => console.log('Desconexión:', socket.id));
});

app.use(cors());
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Inyección dinámica de Rutas
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor de Fulbito operando en el puerto ${PORT}`));
```

### 2. Motor de Eventos Inmediatos (matchController.js)
Cuando el Reloj Inteligente del Árbitro envía una actualización de Goles o Tarjetas, el backend no solo escribe en la base de datos, sino que avisa instantáneamente a la Televisión y al Celular.
```javascript
exports.updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Actualización atómica en MongoDB
    const partidoActualizado = await Match.findByIdAndUpdate(
        id, req.body, { returnDocument: 'after' }
    );
    
    if (!partidoActualizado) return res.status(404).json({ mensaje: 'Partido no encontrado' });
    
    // Si el middleware de inyección funciona, emitimos el evento de repintado a todos los clientes
    if (req.io) {
      req.io.emit('match_updated', id);
      
      // Lógica especial si el árbitro pita el final del partido
      if (req.body.isFinished === true) {
        req.io.emit('match_finished', {
          matchId: id,
          homeTeam: partidoActualizado.homeTeam,
          awayTeam: partidoActualizado.awayTeam,
          homeScore: partidoActualizado.homeScore,
          awayScore: partidoActualizado.awayScore
        });
      }
    }
    
    res.status(200).json(partidoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error interno', error: error.message });
  }
};
```

### 3. Autenticación y Generación JWT (authController.js)
El Backend protege la plataforma creando Firmas Hash robustas para las contraseñas y emitiendo JSON Web Tokens encriptados con una semilla `.env`.
```javascript
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. Verificar existencia del usuario
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // 2. Comparación criptográfica de Hashes Bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

        // 3. Firma del JWT
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' }
        );

        res.status(200).json({ 
            token, 
            user: { id: user._id, username: user.username, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Fallo de Servidor', error });
    }
};
```

### 4. Guardián de Rutas Seguras (authMiddleware.js)
Un interceptor lógico que previene que atacantes modifiquen datos sin poseer un JWT válido.
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Busca el token en los headers "Authorization: Bearer <token>"
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Acceso Denegado. Token inexistente.' });

    try {
        // Desencripta la firma. Si es apócrifo o expirado, lanza Excepción
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; 
        next(); // Permite el paso al Controlador
    } catch (error) {
        res.status(400).json({ message: 'Token Invalido o Expirado' });
    }
};
```

### 5. Configuración de Subida Binaria (uploadMiddleware.js)
Uso de `multer` para transformar la información `form-data` binaria proveniente del Celular y guardarla físicamente en el disco del servidor.
```javascript
const multer = require('multer');
const path = require('path');

// Configuración de Motor de Almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Carpeta donde se volcarán los bytes
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Renombrado anti-colisiones usando Epoch Time
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Limitación y aceptación del archivo
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite estricto de 5 Megabytes
});

module.exports = upload;
```

### 6. Relaciones Documentales Avanzadas (Match.js)
El esquema Mongoose muestra cómo se aplican las relaciones entre Colecciones simulando llaves foráneas (`ObjectId`).
```javascript
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  
  // Referencias a la colección 'Team' (Llaves Foráneas NoSQL)
  homeTeamRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  awayTeamRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  
  // Referencia a la Liga principal
  leagueRef: { type: mongoose.Schema.Types.ObjectId, ref: 'League' },

  fecha: { type: String, required: true }, // Formato 'yyyy-MM-dd'
  hora: { type: String, required: true },
  
  // Contadores del Wear OS
  elapsedTime: { type: Number, default: 0 }, // Segundos
  period: { type: Number, default: 1 }, 
  isFinished: { type: Boolean, default: false },
}, { timestamps: true }); // Agrega createdAt y updatedAt automáticamente

module.exports = mongoose.model('Match', MatchSchema);
```

---

## Ejecución del Proyecto Backend

Para encender el servidor y ponerlo a la escucha en una IP local:

1. Modifica o crea el archivo `.env` en la raíz del proyecto para definir la conexión:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/fulbitoDB
   JWT_SECRET=tuClaveSuperSecreta
   ```
2. Instala todos los paquetes de Node.js:
   ```bash
   npm install
   ```
3. (Opcional) Ejecuta el script de inicialización para crear al usuario Administrador raíz:
   ```bash
   node create_admin.js
   ```
4. Levanta el servidor:
   ```bash
   node index.js
   ```
   *(También se recomienda el uso de `nodemon` para entornos de desarrollo).*
