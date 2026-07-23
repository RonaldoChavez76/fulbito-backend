/**
 * Archivo: controllers/playerController.js
 * Descripción: Controlador para operaciones de jugadores,
 *              como listado por partido, creación, actualización y eliminación.
 */
const Player = require('../models/Player');

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