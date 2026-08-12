/**
 * Archivo: controllers/eventController.js
 * Descripción: Controlador para la gestión de eventos de partidos,
 *              incluyendo registro, consulta, edición y eliminación.
 */
const Event = require('../models/Event');
const Match = require('../models/Match');

/**
 * Registra un nuevo evento (Gol, Tarjeta Amarilla, Tarjeta Roja) en un partido en curso.
 * Si el evento es un gol, incrementa el marcador del partido y los goles personales del jugador,
 * y emite las alertas en tiempo real a los clientes conectados vía Socket.io.
 * 
 * @param {Object} req - Petición Express (body: detalles del evento como matchId, type, teamId, playerDorsal)
 * @param {Object} res - Respuesta Express
 */
exports.registerEvent = async (req, res) => {
  try {
    console.log("\n--- NUEVO EVENTO RECIBIDO DESDE EL RELOJ (vía eventController) ---");
    console.log(req.body);
    
    const { matchId, type, teamId } = req.body;

    // 1. Guardar el evento en el historial
    const nuevoEvento = new Event(req.body);
    const eventoGuardado = await nuevoEvento.save();

    // 2. Si el evento es un gol, modificamos automáticamente el marcador del Match y del Player
    if (type === 'GOAL' || type === 'GOL') {
      const numTeamId = Number(teamId);
      const campoIncremento = numTeamId === 0 ? { homeScore: 1 } : { awayScore: 1 };
      const partido = await Match.findById(matchId);
      
      if (partido) {
        await Match.findByIdAndUpdate(matchId, { $inc: campoIncremento });
        
        const teamRef = numTeamId === 0 ? partido.homeTeamRef : partido.awayTeamRef;
        const playerDorsal = String(req.body.playerDorsal);
        
        console.log(`[GOL] Buscando jugador para actualizar goles. Partido: ${matchId}, teamRef: ${teamRef}, dorsal: "${playerDorsal}", teamId: ${teamId}`);
        
        let playerQuery;
        let insertData = {
          name: `Jugador #${playerDorsal}`,
          position: "Jugador",
          isManualEntry: true
        };

        if (teamRef) {
          playerQuery = { teamRef: teamRef, dorsal: String(playerDorsal) };
        } else {
          playerQuery = { matchId: matchId, teamId: Number(teamId), dorsal: String(playerDorsal) };
          insertData.teamId = Number(teamId);
          insertData.matchId = matchId;
        }
        
        const Player = require('../models/Player');
        const playerResult = await Player.findOneAndUpdate(
          playerQuery,
          { 
            $inc: { goals: 1 },
            $setOnInsert: insertData
          },
          { returnDocument: 'after', upsert: true }
        );
        
        if (playerResult) {
          console.log(`[GOL] ÉXITO: Jugador actualizado -> ${playerResult.name} (Goles: ${playerResult.goals})`);
        } else {
          console.log(`[GOL] ERROR: Jugador NO ENCONTRADO en BD. Revisa si el dorsal ${playerDorsal} existe en el equipo local/visita.`);
        }
      }
    }

    if (req.io) {
      req.io.emit('match_updated', matchId);
      // Evento detallado para notificaciones en la app Android
      req.io.emit('match_event', {
        matchId,
        type,
        teamId,
        playerDorsal: req.body.playerDorsal || null
      });
    }

    res.status(201).json(eventoGuardado);
  } catch (error) {
    console.error("[ERROR GRAVE AL REGISTRAR EVENTO]:", error.message);
    console.error(error);
    res.status(400).json({ mensaje: 'Error al registrar evento', error: error.message });
  }
};

/**
 * Consulta y devuelve el historial cronológico completo de todos los eventos
 * registrados en un partido específico.
 * 
 * @param {Object} req - Petición Express (params: matchId)
 * @param {Object} res - Respuesta Express
 */
exports.getEventsByMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const events = await Event.find({ matchId }).sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener historial", error });
    }
};

/**
 * Permite actualizar un evento existente (por ejemplo, corregir el minuto 
 * o el tipo de sanción si el árbitro se equivocó).
 * 
 * @param {Object} req - Petición Express (params: id, body: nuevos datos)
 * @param {Object} res - Respuesta Express
 */
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { playerDorsal } = req.body;

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { playerDorsal },
            { returnDocument: 'after' }
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