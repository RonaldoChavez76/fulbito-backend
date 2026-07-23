const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Registrar un nuevo usuario
exports.register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear el nuevo usuario
        const newUser = new User({
            username,
            password: hashedPassword,
            role: role || 'Cliente' // Por defecto será Cliente si no se especifica
        });

        const savedUser = await newUser.save();
        
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                role: savedUser.role
            }
        });
    } catch (error) {
        console.error("Error en register:", error);
        res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
};

// Iniciar sesión
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar el usuario
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Login exitoso, devolvemos info básica (en una app real se usaría JWT)
        res.json({
            message: 'Login exitoso',
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
    }
};
