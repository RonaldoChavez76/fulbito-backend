/**
 * Archivo: controllers/matchController.js
 * Descripción: Controlador para operaciones de partidos,
 *              incluyendo creación, consulta, actualización y registro de eventos.
 */
const Match = require('../models/Match');
const Player = require('../models/Player');
const Event = require('../models/Event');

// Crear un nuevo partido
exports.createMatch = async (req, res) => {
  try {
    const nuevoPartido = new Match(req.body);
    const partidoGuardado = await nuevoPartido.save();
    res.status(201).json(partidoGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear partido', error: error.message });
  }
};

// Obtener todos los partidos
exports.getAllMatches = async (req, res) => {
  try {
    // Obtener todos los partidos ordenados por fecha y hora (los más próximos primero)
    const partidos = await Match.find().sort({ fecha: 1, hora: 1 });
    res.status(200).json(partidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener partidos', error: error.message });
  }
};

// Obtener los detalles completos de un partido por su ID
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

// Actualizar el estado global del partido (cronómetro, pausa, periodos)
exports.updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const partidoActualizado = await Match.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
    
    if (!partidoActualizado) {
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }
    
    if (req.io) {
      req.io.emit('match_updated', id);
    }
    
    res.status(200).json(partidoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar partido', error: error.message });
  }
};

// Registrar un suceso histórico (Gol o Tarjeta) y actualizar el marcador de forma inteligente si es GOAL
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

// Eliminar un partido
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