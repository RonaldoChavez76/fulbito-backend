/**
 * Archivo: controllers/eventController.js
 * Descripción: Controlador para la gestión de eventos de partidos (por ejemplo: Goles, Tarjetas, Sustituciones).
 *              Permite registrar eventos y sincronizar automáticamente el marcador de un partido,
 *              así como gestionar estadísticas de los jugadores en vivo. Emite los eventos al servidor Socket.io.
 */

const Event = require('../models/Event');
const Match = require('../models/Match');

/**
 * Registra un nuevo evento durante un partido.
 * Si el evento es un gol ('GOAL' o 'GOL'), incrementa automáticamente el marcador del partido (Match)
 * y las estadísticas del jugador correspondiente (Player). Emite un evento WebSocket para notificar el cambio.
 * 
 * @param {Object} req - Objeto de petición (body incluye matchId, type, teamId, playerDorsal).
 * @param {Object} res - Objeto de respuesta.
 * @returns {JSON} El evento guardado en base de datos.
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
 * Obtiene el historial completo de eventos asociados a un partido específico.
 * Utilizado por los clientes para reconstruir la cronología del partido.
 * 
 * @param {Object} req - Petición (params: matchId).
 * @param {Object} res - Respuesta.
 * @returns {Array} Lista de eventos ordenados por fecha de creación descendente.
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
 * Actualiza la información de un evento existente, específicamente útil para corregir
 * el dorsal de un jugador asociado a una tarjeta o gol previamente registrado.
 * 
 * @param {Object} req - Petición (params: id, body: playerDorsal).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Evento actualizado.
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

/**
 * Elimina un evento registrado. 
 * Si el evento eliminado era un gol ('GOAL'), reduce el marcador del partido (Match)
 * en consecuencia, evitando que el marcador quede por debajo de 0.
 * 
 * @param {Object} req - Petición (params: id).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Mensaje de confirmación.
 */
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