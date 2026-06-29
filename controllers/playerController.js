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
        const updatedPlayer = await Player.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
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