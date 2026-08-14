/**
 * Archivo: controllers/teamController.js
 * Descripción: Controlador encargado de la gestión de equipos de fútbol.
 *              Incluye endpoints para crear, leer (listar y filtrar por liga), 
 *              actualizar y eliminar equipos.
 */

const Team = require('../models/Team');
const Player = require('../models/Player');

/**
 * Crea un nuevo equipo en la base de datos.
 * 
 * @param {Object} req - Objeto de petición (body: {name, category, captain, shieldUrl, leagues}).
 * @param {Object} res - Objeto de respuesta.
 * @returns {JSON} El equipo creado.
 */
exports.createTeam = async (req, res) => {
  try {
    const { name, category, captain, shieldUrl, leagues, captainDorsal } = req.body;
    const newTeam = new Team({ 
      name, 
      category, 
      captain, 
      shieldUrl, 
      leagues: leagues || [] 
    });
    const savedTeam = await newTeam.save();

    // Crear el jugador capitán si se proporcionó dorsal
    if (captainDorsal && captainDorsal.trim() !== '') {
        const captainPlayer = new Player({
            teamRef: savedTeam._id,
            dorsal: captainDorsal,
            name: captain || "Capitán",
            position: "Capitán",
            isCaptain: true,
            isManualEntry: false
        });
        await captainPlayer.save();
    }

    res.status(201).json(savedTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene la lista de equipos registrados. 
 * Permite filtrar por una liga específica proporcionando el query param `leagueId`.
 * 
 * @param {Object} req - Petición (query: { leagueId }).
 * @param {Object} res - Respuesta.
 * @returns {Array} Lista de equipos.
 */
exports.getTeams = async (req, res) => {
  try {
    const { leagueId } = req.query;
    let query = {};
    if (leagueId) {
      query.leagues = leagueId;
    }
    const teams = await Team.find(query);
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualiza la información de un equipo existente.
 * 
 * @param {Object} req - Petición (params: id, body con campos a modificar).
 * @param {Object} res - Respuesta.
 * @returns {JSON} El equipo modificado.
 */
exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTeam = await Team.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
    res.status(200).json(updatedTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Elimina permanentemente un equipo de la base de datos.
 * 
 * @param {Object} req - Petición (params: id).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Mensaje de confirmación.
 */
exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    await Team.findByIdAndDelete(id);
    res.status(200).json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
