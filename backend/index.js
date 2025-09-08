import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const app = express();

// Para __dirname en ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
import multer from 'multer';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'src/images');
    if (!existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
app.use('/api/prices', upload.single('photo'), pricesRoutes);

// 1. Rutas de API primero
import authRoutes from './src/routes/authRoutes.js';
app.use('/api/auth', authRoutes);

import storesRoutes from './src/routes/storesRoutes.js';
app.use('/api/stores', storesRoutes);

import brandsRoutes from './src/routes/brandsRoutes.js';
app.use('/api/brands', brandsRoutes);

import groupsRoutes from './src/routes/groupsRoutes.js';
app.use('/api/groups', groupsRoutes);

import productsRoutes from './src/routes/productsRoutes.js';
app.use('/api/products', productsRoutes);

app.use('/api/images', express.static(path.join(__dirname, 'src/images')));

import pricesRoutes from './src/routes/pricesRoutes.js';
app.use('/api/prices', pricesRoutes);

import overviewRoutes from './src/routes/overviewRoutes.js';
app.use('/api/overview', overviewRoutes);

import adminRoutes from './src/routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);

import regionsRoutes from './src/routes/regionsRoutes.js';
app.use('/api/regions', regionsRoutes);

import observationsRoutes from './src/routes/observationsRoutes.js';
app.use('/api/observations', observationsRoutes);

import checkinsRoutes from './src/routes/checkinsRoutes.js';
app.use('/api/checkins', checkinsRoutes);

// 2. Servir archivos estáticos del frontend
const staticPath = path.join(__dirname, './build-pwa');

// Servir archivos estáticos
app.use(express.static(staticPath));

// 3. Catch-all para SPA (ÚNICAMENTE para rutas no manejadas por API o archivos estáticos)
app.get(/^(?!\/?api).*/, (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');

  // Verificar si el archivo existe
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('Error: No se encontró el archivo index.html en:', indexPath);
    res.status(500).send('Error: Archivo de aplicación no encontrado');
  }
});

process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Promise rechazada no capturada:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});