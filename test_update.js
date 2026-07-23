const mongoose = require('mongoose');
const Player = require('./models/Player');
const Match = require('./models/Match');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fulbito');
  console.log("Connected");

  const matchId = '6a60293703f023e9cd382857';
  const playerDorsal = '10';
  const teamId = 1;

  const partido = await Match.findById(matchId);
  console.log("Partido found:", partido != null);
  
  if (partido) {
    const numTeamId = Number(teamId);
    const teamRef = numTeamId === 0 ? partido.homeTeamRef : partido.awayTeamRef;
    
    console.log(`[TEST] matchId: ${matchId}, teamRef: ${teamRef}, dorsal: "${playerDorsal}", teamId: ${teamId}`);
    
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
    
    console.log("Executing findOneAndUpdate with query:", playerQuery);
    
    const playerResult = await Player.findOneAndUpdate(
      playerQuery,
      { 
        $inc: { goals: 1 },
        $setOnInsert: insertData
      },
      { returnDocument: 'after', upsert: true }
    );
    
    console.log("Result:", playerResult);
  }
  
  process.exit(0);
}

run().catch(console.error);
