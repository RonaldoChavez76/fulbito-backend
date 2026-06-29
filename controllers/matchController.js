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
    const partidos = await Match.find();
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

    // Buscamos los jugadores y eventos vinculados a este partido específico
    const jugadores = await Player.find({ matchId: id });
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
    const partidoActualizado = await Match.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!partidoActualizado) {
      return res.status(404).json({ mensaje: 'Partido no encontrado' });
    }
    res.status(200).json(partidoActualizado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar partido', error: error.message });
  }
};

// Registrar un suceso histórico (Gol o Tarjeta) y actualizar el marcador de forma inteligente si es GOAL
exports.registerEvent = async (req, res) => {
  try {
    const { matchId, type, teamId } = req.body;

    // 1. Guardar el evento en el historial
    const nuevoEvento = new Event(req.body);
    const eventoGuardado = await nuevoEvento.save();

    // 2. Si el evento es un gol, modificamos automáticamente el marcador del Match
    if (type === 'GOAL') {
      const campoIncremento = teamId === 0 ? { homeScore: 1 } : { awayScore: 1 };
      await Match.findByIdAndUpdate(matchId, { $inc: campoIncremento });
    }

    res.status(201).json(eventoGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al registrar evento', error: error.message });
  }
};