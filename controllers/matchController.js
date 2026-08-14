/**
 * Archivo: controllers/matchController.js
 * Descripción: Controlador para operaciones relacionadas con los partidos.
 *              Incluye la creación, consulta (con información de jugadores y eventos combinada),
 *              actualización del estado de juego (tiempo, periodos) y eliminación.
 */
const Match = require('../models/Match');
const Player = require('../models/Player');
const Event = require('../models/Event');

/**
 * Crea un nuevo partido en blanco, inicialmente programado.
 * 
 * @param {Object} req - Petición (body con datos del partido).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Partido creado.
 */
exports.createMatch = async (req, res) => {
  try {
    const nuevoPartido = new Match(req.body);
    const partidoGuardado = await nuevoPartido.save();
    res.status(201).json(partidoGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear partido', error: error.message });
  }
};

/**
 * Obtiene todos los partidos, opcionalmente filtrados por liga.
 * Ordena los resultados por fecha y hora ascendente.
 * 
 * @param {Object} req - Petición (query opcional: leagueId).
 * @param {Object} res - Respuesta.
 * @returns {Array} Lista de partidos encontrados.
 */
exports.getAllMatches = async (req, res) => {
  try {
    const { leagueId } = req.query;
    let query = {};
    if (leagueId) {
      query.leagueRef = leagueId;
    }
    // Obtener todos los partidos ordenados por fecha y hora (los más próximos primero)
    const partidos = await Match.find(query).sort({ fecha: 1, hora: 1 });
    res.status(200).json(partidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener partidos', error: error.message });
  }
};

/**
 * Obtiene los detalles completos de un partido.
 * Esto no solo devuelve la info del `Match`, sino que también agrupa
 * a los jugadores locales (teamId: 0) y visitantes (teamId: 1) junto a 
 * todos los eventos ocurridos en este partido, para enviarlo al Smartwatch o app móvil.
 * 
 * @param {Object} req - Petición (params: id).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Objeto complejo con { partido, jugadores, eventos }.
 */
exports.getMatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const partido = await Match.findById(id);
    
    if (!partido) {
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }

    // Buscamos los jugadores vinculados a este partido específico (añadidos manualmente)
    const jugadoresManuales = await Player.find({ matchId: id });

    // Buscamos los jugadores globales que pertenecen a los equipos de este partido
    let jugadoresHome = [];
    let jugadoresAway = [];
    
    if (partido.homeTeamRef) {
      jugadoresHome = await Player.find({ teamRef: partido.homeTeamRef });
    }
    if (partido.awayTeamRef) {
      jugadoresAway = await Player.find({ teamRef: partido.awayTeamRef });
    }

    // Mapeamos los jugadores para que la app del reloj sepa quién es Local (0) y Visita (1)
    const mapeadosHome = jugadoresHome.map(p => ({ ...p.toObject(), teamId: 0 }));
    const mapeadosAway = jugadoresAway.map(p => ({ ...p.toObject(), teamId: 1 }));
    const jugadores = [...jugadoresManuales, ...mapeadosHome, ...mapeadosAway];

    const eventos = await Event.find({ matchId: id });

    res.status(200).json({ partido, jugadores, eventos });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener detalles', error: error.message });
  }
};

/**
 * Actualiza el estado global de un partido (tiempo, periodo actual, pausa).
 * Tras actualizar la base de datos, emite un evento WebSocket ('match_updated') 
 * para que el Scoreboard (TV) se sincronice.
 * 
 * @param {Object} req - Petición (params: id, body: cambios de estado).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Partido actualizado.
 */
exports.updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const partidoActualizado = await Match.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
    
    if (!partidoActualizado) {
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }
    
    if (req.io) {
      req.io.emit('match_updated', id);
      // Si el partido acaba de terminar, emitir evento especial para notificar al admin
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
    res.status(400).json({ mensaje: 'Error al actualizar partido', error: error.message });
  }
};

/**
 * Registra un evento de partido (como en eventController).
 * Este método delega de manera similar el guardado del historial y 
 * ajusta contadores de goles si corresponde.
 * 
 * @param {Object} req - Petición.
 * @param {Object} res - Respuesta.
 * @returns {JSON} Evento guardado.
 */
exports.registerEvent = async (req, res) => {
  try {
    console.log("\n--- NUEVO EVENTO RECIBIDO DESDE EL RELOJ ---");
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
    }

    res.status(201).json(eventoGuardado);
  } catch (error) {
    console.error("[ERROR GRAVE AL REGISTRAR EVENTO]:", error.message);
    console.error(error);
    res.status(400).json({ mensaje: 'Error al registrar evento', error: error.message });
  }
};

/**
 * Elimina un partido de la base de datos.
 * Aplica un borrado en cascada (Cascade Delete) de los eventos y
 * jugadores creados manualmente exclusivamente para este partido.
 * 
 * @param {Object} req - Petición (params: id).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Mensaje de éxito.
 */
exports.deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    await Match.findByIdAndDelete(id);
    // Opcional: Eliminar los eventos y jugadores vinculados al partido (Cascade Delete)
    await Event.deleteMany({ matchId: id });
    await Player.deleteMany({ matchId: id, isManualEntry: true }); 
    res.status(200).json({ mensaje: 'Partido eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar partido', error: error.message });
  }
};