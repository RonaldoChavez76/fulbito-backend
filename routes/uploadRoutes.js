/**
 * Archivo: routes/uploadRoutes.js
 * Descripción: Configura y expone la ruta para subir archivos estáticos (imágenes de escudos/perfiles).
 *              Utiliza `multer` para el almacenamiento en disco dentro de la carpeta /uploads.
 *              Prefijo esperado: /api/upload
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear la carpeta uploads si no existe de forma síncrona
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento local de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Carpeta donde se guardan temporalmente en el servidor
    },
    filename: function (req, file, cb) {
        // Generar un nombre único basado en timestamp y número aleatorio
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

/**
 * Middleware Multer con filtros de seguridad.
 * Límite de tamaño: 5MB.
 * Límite de tipos: Exclusivamente imágenes (jpeg, jpg, png, gif, webp).
 */
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Solo se permiten imágenes"));
    }
});

/**
 * Endpoint para subir una imagen de forma individual.
 * El campo del formulario 'multipart/form-data' debe llamarse 'image'.
 */
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
        }
        
        // Devolvemos solo la ruta relativa para que el cliente la una con su BASE_URL
        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.status(200).json({ url: fileUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
