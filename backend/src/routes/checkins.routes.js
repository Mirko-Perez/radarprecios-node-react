import { Router } from 'express';
import { validateJWT } from '../middlewares/validateJWT.js';
import { 
    createCheckIn, 
    getActiveCheckIn, 
    createCheckOut 
} from '../controllers/checkins.controller.js';

const router = Router();

// Aplicar el middleware de autenticación a todas las rutas
router.use(validateJWT);

// Obtener check-in activo del usuario actual
router.get('/active', getActiveCheckIn);

// Crear un nuevo check-in
router.post('/', createCheckIn);

// Hacer check-out
router.put('/:checkin_id/checkout', createCheckOut);

export default router;
