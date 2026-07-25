const Team = require('../models/Team');
const Player = require('../models/Player');

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

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTeam = await Team.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
    res.status(200).json(updatedTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    await Team.findByIdAndDelete(id);
    res.status(200).json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
