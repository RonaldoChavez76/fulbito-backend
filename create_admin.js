const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://localhost:27017/fulbito';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB...');

    // Verificar si ya existe
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('El usuario admin ya existe. Actualizando la contraseña a "adminpassword"...');
      await User.deleteOne({ username: 'admin' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashAdmin = await bcrypt.hash('adminpassword', salt);

    const userAdmin = new User({ username: 'admin', password: hashAdmin, role: 'Admin' });
    await userAdmin.save();

    console.log('Usuario Admin creado/restaurado exitosamente:');
    console.log('Username: admin');
    console.log('Password: adminpassword');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error creando el admin:', error);
    mongoose.disconnect();
  }
}

createAdmin();
