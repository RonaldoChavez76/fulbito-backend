/**
 * Archivo: controllers/authController.js
 * Descripción: Controlador que gestiona la autenticación de usuarios. 
 *              Incluye funciones para el registro, inicio de sesión y cambio de contraseñas, 
 *              utilizando bcryptjs para el cifrado seguro de contraseñas.
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Registra un nuevo usuario en el sistema.
 * Verifica que el nombre de usuario no esté en uso, hashea la contraseña proporcionada 
 * y guarda el nuevo documento en la base de datos MongoDB.
 * 
 * @param {Object} req - Objeto de petición Express (body: {username, password, role}).
 * @param {Object} res - Objeto de respuesta Express.
 * @returns {JSON} Retorna el usuario guardado o un mensaje de error.
 */
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

/**
 * Inicia la sesión de un usuario existente.
 * Valida la existencia del nombre de usuario y comprueba que la contraseña
 * coincida con el hash guardado usando bcrypt.
 * 
 * @param {Object} req - Objeto de petición Express (body: {username, password}).
 * @param {Object} res - Objeto de respuesta Express.
 * @returns {JSON} Información básica del usuario logueado o error de credenciales.
 */
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

/**
 * Permite a un usuario cambiar su contraseña actual.
 * Requiere enviar la contraseña antigua para validación antes de 
 * establecer y hashear la nueva contraseña.
 * 
 * @param {Object} req - Objeto de petición Express (body: {userId, oldPassword, newPassword}).
 * @param {Object} res - Objeto de respuesta Express.
 * @returns {JSON} Mensaje de éxito o error en la validación.
 */
exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error("Error en changePassword:", error);
        res.status(500).json({ message: 'Error al cambiar la contraseña', error: error.message });
    }
};
