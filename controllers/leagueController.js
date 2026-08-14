/**
 * Archivo: controllers/leagueController.js
 * Descripción: Controlador para la gestión de las ligas de fútbol (Fulbito).
 *              Permite listar, consultar detalles, crear, actualizar y eliminar ligas.
 */

const League = require('../models/League');

/**
 * Obtiene todas las ligas registradas en el sistema.
 * 
 * @param {Object} req - Objeto de petición.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Array} Lista completa de ligas.
 */
exports.getLeagues = async (req, res) => {
  try {
    const leagues = await League.find();
    res.json(leagues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Obtiene los detalles de una liga específica por su ID.
 * 
 * @param {Object} req - Petición (params: id).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Objeto de la liga encontrada o un 404 si no existe.
 */
exports.getLeagueById = async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) return res.status(404).json({ message: 'League not found' });
    res.json(league);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Crea una nueva liga.
 * 
 * @param {Object} req - Petición (body: {name, description, logoUrl}).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Liga recién creada.
 */
exports.createLeague = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;
    const newLeague = new League({ name, description, logoUrl });
    const savedLeague = await newLeague.save();
    res.status(201).json(savedLeague);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Actualiza los datos principales de una liga existente.
 * 
 * @param {Object} req - Petición (params: id, body: {name, description, logoUrl}).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Liga actualizada.
 */
exports.updateLeague = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;
    const updated = await League.findByIdAndUpdate(
      req.params.id,
      { name, description, logoUrl },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Elimina una liga de la base de datos de manera permanente.
 * 
 * @param {Object} req - Petición (params: id).
 * @param {Object} res - Respuesta.
 * @returns {JSON} Mensaje de éxito.
 */
exports.deleteLeague = async (req, res) => {
  try {
    await League.findByIdAndDelete(req.params.id);
    res.json({ message: 'League deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
