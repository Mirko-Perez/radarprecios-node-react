import express from 'express';
import { getAllRegions } from '../controllers/regionsController.js';

const router = express.Router();

// Obtener todas las regiones
router.get('/', getAllRegions);

export default router;
