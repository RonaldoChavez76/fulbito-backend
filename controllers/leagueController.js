const League = require('../models/League');

exports.getLeagues = async (req, res) => {
  try {
    const leagues = await League.find();
    res.json(leagues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeagueById = async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) return res.status(404).json({ message: 'League not found' });
    res.json(league);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

exports.deleteLeague = async (req, res) => {
  try {
    await League.findByIdAndDelete(req.params.id);
    res.json({ message: 'League deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
