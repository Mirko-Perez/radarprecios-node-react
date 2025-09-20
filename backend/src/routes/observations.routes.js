import { Router } from 'express';
import { 
    getObservations, 
    addObservation, 
    updateObservationStatus,
    getObservationsWithDetails
} from '../controllers/observations.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Obtener todas las observaciones (solo activas)
router.get('/', authenticateToken, getObservations);

// Obtener todas las observaciones con detalles completos (usuarios, tiendas, etc.)
router.get('/details', authenticateToken, getObservationsWithDetails);

// Agregar nueva observación
router.post('/', authenticateToken, addObservation);

// Actualizar estado de observación
router.put('/:id/status', authenticateToken, updateObservationStatus);

export default router;
