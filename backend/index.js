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

// 1. Rutas de API primero
import authRoutes from './src/routes/auth.routes.js';
app.use('/api/auth', authRoutes);

import storesRoutes from './src/routes/stores.routes.js';
app.use('/api/stores', storesRoutes);

import brandsRoutes from './src/routes/brands.routes.js';
app.use('/api/brands', brandsRoutes);

import groupsRoutes from './src/routes/groups.routes.js';
app.use('/api/groups', groupsRoutes);

import productsRoutes from './src/routes/products.routes.js';
app.use('/api/products', productsRoutes);

import regionsRoutes from './src/routes/regions.routes.js';
app.use('/api/regions', regionsRoutes);

import pricesRoutes from './src/routes/prices.routes.js';
app.use('/api/prices', pricesRoutes);

import overviewRoutes from './src/routes/overview.routes.js';
app.use('/api/overview', overviewRoutes);

import adminRoutes from './src/routes/admin.routes.js';
app.use('/api/admin', adminRoutes);

import observationsRoutes from './src/routes/observations.routes.js';
app.use('/api/observations', observationsRoutes);

import checkinsRoutes from './src/routes/checkins.routes.js';
app.use('/api/checkins', checkinsRoutes);

import permisosRouter from "./src/routes/permisos.routes.js";
app.use("/api/permisos", permisosRouter);

// Servir archivos estáticos de imágenes
app.use('/api/images', express.static(path.join(__dirname, 'src/images')));

import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';

// 2. Servir archivos estáticos del frontend
const staticPath = path.join(__dirname, './build-pwa');

console.log('Directorio estático:', staticPath);
app.use(express.static(staticPath));

// Manejar rutas no encontradas de la API
app.use(/^\/api\/.*$/, notFoundHandler);


// Catch-all handler: enviar el archivo index.html para rutas del frontend
app.get(/^(?!\/?api).*/, (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');

  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('Archivo index.html no encontrado en:', indexPath);
    res.status(404).send('Frontend no encontrado');
  }
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada en:', promise, 'razón:', reason);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});