const mongoose = require('mongoose');
const League = require('./models/League');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Match = require('./models/Match');
const User = require('./models/User'); // Importar el modelo User

// Reemplaza con tu cadena de conexión si es diferente
const MONGODB_URI = 'mongodb://localhost:27017/fulbito';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB...');

    // Limpiar colecciones
    await League.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    await Match.deleteMany({});
    await User.deleteMany({});
    console.log('Colecciones limpiadas.');

    // Crear Ligas
    const ligaVaronil = new League({ name: 'Liga Varonil Sabatina', description: 'Torneo de fin de semana para categoría libre varonil.' });
    const ligaFemenil = new League({ name: 'Liga Femenil Nocturna', description: 'Torneo entre semana categoría libre femenil.' });
    await ligaVaronil.save();
    await ligaFemenil.save();
    console.log('Ligas creadas.');

    // Crear Equipos
    const equipoA = new Team({ name: 'Los Galácticos', category: 'Libre', captain: 'Juan Pérez', leagues: [ligaVaronil._id] });
    const equipoB = new Team({ name: 'Real Madrid Falso', category: 'Libre', captain: 'Pedro López', leagues: [ligaVaronil._id] });
    const equipoC = new Team({ name: 'Amazonas FC', category: 'Libre Femenil', captain: 'María García', leagues: [ligaFemenil._id] });
    const equipoD = new Team({ name: 'Estrellas Negras', category: 'Libre Femenil', captain: 'Ana Torres', leagues: [ligaFemenil._id] });
    
    await equipoA.save();
    await equipoB.save();
    await equipoC.save();
    await equipoD.save();
    console.log('Equipos creados.');

    // Crear Usuarios (Autenticación) con contraseñas hasheadas
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashAdmin = await bcrypt.hash('adminpassword', salt);
    const hashPlayer = await bcrypt.hash('password123', salt);

    const userAdmin = new User({ username: 'admin', password: hashAdmin, role: 'Admin' });
    const userCarlos = new User({ username: 'carlos10', password: hashPlayer, role: 'Jugador' });
    const userLuis = new User({ username: 'luis1', password: hashPlayer, role: 'Jugador' });
    const userRoberto = new User({ username: 'roberto9', password: hashPlayer, role: 'Jugador' });
    const userLaura = new User({ username: 'laura10', password: hashPlayer, role: 'Jugador' });
    const userSofia = new User({ username: 'sofia7', password: hashPlayer, role: 'Jugador' });

    await userAdmin.save();
    await userCarlos.save();
    await userLuis.save();
    await userRoberto.save();
    await userLaura.save();
    await userSofia.save();
    console.log('Usuarios (Credenciales) creados.');

    // Crear Jugadores Varonil (Relacionados al User)
    const j1 = new Player({ name: 'Carlos', dorsal: '10', position: 'Delantero', teamRef: equipoA._id, userId: userCarlos._id });
    const j2 = new Player({ name: 'Luis', dorsal: '1', position: 'Portero', teamRef: equipoA._id, userId: userLuis._id });
    const j3 = new Player({ name: 'Roberto', dorsal: '9', position: 'Delantero', teamRef: equipoB._id, userId: userRoberto._id });
    
    // Crear Jugadoras Femenil (Relacionados al User)
    const j4 = new Player({ name: 'Laura', dorsal: '10', position: 'Medio', teamRef: equipoC._id, userId: userLaura._id });
    const j5 = new Player({ name: 'Sofía', dorsal: '7', position: 'Defensa', teamRef: equipoD._id, userId: userSofia._id });

    await j1.save();
    await j2.save();
    await j3.save();
    await j4.save();
    await j5.save();
    console.log('Jugadores creados y enlazados a usuarios.');

    // Crear Partido de ejemplo
    const partidoVaronil = new Match({
      homeTeam: equipoA.name,
      awayTeam: equipoB.name,
      homeTeamRef: equipoA._id,
      awayTeamRef: equipoB._id,
      leagueRef: ligaVaronil._id,
      fecha: '25/08/2026',
      hora: '10:00'
    });

    const partidoFemenil = new Match({
      homeTeam: equipoC.name,
      awayTeam: equipoD.name,
      homeTeamRef: equipoC._id,
      awayTeamRef: equipoD._id,
      leagueRef: ligaFemenil._id,
      fecha: '26/08/2026',
      hora: '19:00'
    });

    await partidoVaronil.save();
    await partidoFemenil.save();
    console.log('Partidos creados.');

    console.log('\n--- DATOS DE ACCESO PARA PRUEBAS ---');
    console.log('Admin: username: admin / password: adminpassword');
    console.log('Jugador Carlos (Galácticos): username: carlos10 / password: password123');
    console.log('Jugadora Laura (Amazonas): username: laura10 / password: password123');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error poblando la base de datos:', error);
    mongoose.disconnect();
  }
}

seedDatabase();
