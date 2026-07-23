const mongoose = require('mongoose');
const Player = require('./models/Player');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fulbito');
  const player = await Player.findById('6a6015df0328a3f217fc6b89');
  console.log("Player from DB:", player);
  process.exit(0);
}
run().catch(console.error);
