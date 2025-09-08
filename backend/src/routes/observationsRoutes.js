import express from 'express';
import { getObservations, addObservation, updateObservationStatus } from '../controllers/observationsController.js';

const router = express.Router();

// Ruta para obtener y agregar observaciones
router.get('/', getObservations);
router.post('/', addObservation);
router.put('/:id/status', updateObservationStatus);

export default router;
