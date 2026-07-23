const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');

router.get('/', leagueController.getLeagues);
router.get('/:id', leagueController.getLeagueById);
router.post('/', leagueController.createLeague);
router.put('/:id', leagueController.updateLeague);
router.delete('/:id', leagueController.deleteLeague);

module.exports = router;
