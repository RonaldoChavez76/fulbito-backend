/**
 * Archivo: controllers/playerController.js
 * Descripción: Controlador para operaciones de jugadores,
 *              como listado por partido, creación, actualización y eliminación.
 */
const Player = require('../models/Player');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Event = require('../models/Event');

// 1. Obtener todos los jugadores de un partido específico
exports.getPlayersByMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const players = await Player.find({ matchId });
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener jugadores", error });
    }
};

// 2. Crear un jugador individual
exports.createPlayer = async (req, res) => {
    try {
        const newPlayer = new Player(req.body);
        const savedPlayer = await newPlayer.save();
        res.status(201).json(savedPlayer);
    } catch (error) {
        res.status(500).json({ message: "Error al crear jugador", error });
    }
};

// 3. Registro masivo de jugadores (Cargar alineaciones)
exports.bulkCreatePlayers = async (req, res) => {
    try {
        const { players } = req.body; 
        const savedPlayers = await Player.insertMany(players);
        res.status(201).json(savedPlayers);
    } catch (error) {
        res.status(500).json({ message: "Error en carga masiva", error });
    }
};

// 4. Lógica de "Dorsal Manual" (Upsert)
exports.syncManualPlayer = async (req, res) => {
    try {
        const { matchId, dorsal, teamId } = req.body;
        
        let player = await Player.findOne({ matchId, dorsal, teamId });
        
        if (!player) {
            player = new Player({
                matchId,
                dorsal,
                teamId,
                name: `Jugador ${dorsal}`,
                isManualEntry: true
            });
            await player.save();
        }
        
        res.json(player);
    } catch (error) {
        res.status(500).json({ message: "Error al sincronizar jugador manual", error });
    }
};

// 5. Actualizar datos de un jugador
exports.updatePlayer = async (req, res) => {
    try {
        // Construir el objeto de actualización solo con los campos enviados (no borrar photoUrl si no viene)
        const updateData = {};
        const allowedFields = ['name', 'dorsal', 'position', 'teamRef', 'matchId', 'teamId', 'isManualEntry', 'goals'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        }
        // photoUrl solo se actualiza si viene explicitamente y no está vacío
        if (req.body.photoUrl !== undefined && req.body.photoUrl !== '') {
            updateData.photoUrl = req.body.photoUrl;
        }
        
        const updatedPlayer = await Player.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { returnDocument: 'after' }
        );
        res.json(updatedPlayer);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar jugador", error });
    }
};

// 6. Eliminar un jugador
exports.deletePlayer = async (req, res) => {
    try {
        await Player.findByIdAndDelete(req.params.id);
        res.json({ message: "Jugador eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar jugador", error });
    }
};

// 7. Obtener todos los jugadores (Para Admin)
exports.getAllPlayers = async (req, res) => {
    try {
        const players = await Player.find();
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener jugadores", error });
    }
};

// 8. Obtener jugadores por equipo
exports.getPlayersByTeam = async (req, res) => {
    try {
        const { teamRef } = req.params;
        const players = await Player.find({ teamRef });
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener jugadores por equipo", error });
    }
};

// 9. Tabla de goleo (Real)
exports.getTopScorers = async (req, res) => {
    try {
        const topPlayers = await Player.find({ goals: { $gt: 0 } })
            .sort({ goals: -1 })
            .limit(10)
            .populate('teamRef', 'name');

        const formatScorers = topPlayers.map(p => ({
            name: p.name || `Jugador #${p.dorsal}`,
            team: p.teamRef ? p.teamRef.name : (p.teamId === 0 ? "Local" : "Visita"),
            goals: p.goals
        }));
        
        // Si no hay ninguno, devolver un array vacío
        if (formatScorers.length === 0) {
            return res.json([]);
        }

        res.json(formatScorers);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener goleadores", error });
    }
};

// 10. Generar cuenta de usuario para un jugador (Admin/Capitán)
exports.generateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await Player.findById(id);
        
        if (!player) {
            return res.status(404).json({ message: "Jugador no encontrado" });
        }

        if (player.userId) {
            return res.status(400).json({ message: "El jugador ya tiene una cuenta asociada" });
        }

        // Generar credenciales
        const username = `jugador_${player.dorsal}_${Math.floor(Math.random() * 10000)}`;
        const plainPassword = Math.random().toString(36).slice(-8); // Contraseña aleatoria de 8 caracteres

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        // Crear el usuario
        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'Jugador'
        });
        const savedUser = await newUser.save();

        // Actualizar el jugador
        player.userId = savedUser._id;
        await player.save();

        res.status(201).json({
            message: "Cuenta generada exitosamente",
            credentials: {
                username: username,
                password: plainPassword // Se muestra solo esta vez
            }
        });
    } catch (error) {
        console.error("Error al generar cuenta:", error);
        res.status(500).json({ message: "Error al generar cuenta", error: error.message });
    }
};

// 11. Obtener estadísticas propias (Mis Stats)
exports.getMyStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Buscar todas las apariciones del jugador en diferentes partidos
        const players = await Player.find({ userId });
        
        if (!players || players.length === 0) {
            return res.json({
                matchesPlayed: 0,
                totalGoals: 0,
                yellowCards: 0,
                redCards: 0,
                history: []
            });
        }

        let totalGoals = 0;
        let yellowCards = 0;
        let redCards = 0;
        const history = [];

        for (const p of players) {
            totalGoals += p.goals;

            // Buscar eventos (tarjetas) para este jugador en este partido
            const events = await Event.find({ 
                matchId: p.matchId, 
                teamId: p.teamId, 
                playerDorsal: p.dorsal 
            });

            const matchYellows = events.filter(e => e.type.includes('YELLOW') || e.type.includes('AMARILLA')).length;
            const matchReds = events.filter(e => e.type.includes('RED') || e.type.includes('ROJA')).length;

            yellowCards += matchYellows;
            redCards += matchReds;

            history.push({
                matchId: p.matchId,
                teamId: p.teamId,
                dorsal: p.dorsal,
                goals: p.goals,
                yellowCards: matchYellows,
                redCards: matchReds
            });
        }

        res.json({
            matchesPlayed: players.length,
            totalGoals,
            yellowCards,
            redCards,
            history
        });
    } catch (error) {
        console.error("Error al obtener mis stats:", error);
        res.status(500).json({ message: "Error al obtener estadísticas", error: error.message });
    }
};