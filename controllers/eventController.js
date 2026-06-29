const Event = require('../models/Event');
const Match = require('../models/Match');

// 1. Registrar un nuevo evento (Gol, Amarilla o Roja)
exports.registerEvent = async (req, res) => {
    try {
        const { matchId, type, playerDorsal, teamId, timestampSeconds, period } = req.body;

        const newEvent = new Event({
            matchId,
            type,
            playerDorsal,
            teamId,
            timestampSeconds,
            period
        });
        const savedEvent = await newEvent.save();

        // Si es un GOL, actualizar el marcador en la colección Match
        if (type === 'GOAL') {
            const scoreField = (teamId === 0) ? 'homeScore' : 'awayScore';
            await Match.findByIdAndUpdate(matchId, {
                $inc: { [scoreField]: 1 }
            });
        }

        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(500).json({ message: "Error al registrar evento", error });
    }
};

// 2. Obtener historial de eventos de un partido
exports.getEventsByMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const events = await Event.find({ matchId }).sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener historial", error });
    }
};

// 3. Editar un evento (Corregir dorsal)
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { playerDorsal } = req.body;

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { playerDorsal },
            { new: true }
        );

        if (!updatedEvent) return res.status(404).json({ message: "Evento no encontrado" });
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: "Error al editar evento", error });
    }
};

// 4. Eliminar un evento (Anulación y corrección de marcador)
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const eventToDelete = await Event.findById(id);
        if (!eventToDelete) return res.status(404).json({ message: "Evento no encontrado" });

        // Si era un GOL, restar del marcador del partido
        if (eventToDelete.type === 'GOAL') {
            const scoreField = (eventToDelete.teamId === 0) ? 'homeScore' : 'awayScore';
            
            const match = await Match.findById(eventToDelete.matchId);
            const currentScore = match[scoreField];
            
            await Match.findByIdAndUpdate(eventToDelete.matchId, {
                [scoreField]: Math.max(0, currentScore - 1) 
            });
        }

        await Event.findByIdAndDelete(id);

        res.json({ message: "Evento eliminado y marcador actualizado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar evento", error });
    }
};