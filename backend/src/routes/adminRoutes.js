import { Router } from 'express';
import { 
    crearUsuario, 
    listarUsuarios, 
    actualizarEstadoUsuario 
} from '../controllers/adminController.js';
import { crearUsuarioRules } from '../validators/usuarioValidator.js';
import { validateJWT } from '../middlewares/validateJWT.js';

const router = Router();

// Aplicar el middleware de autenticación a todas las rutas de administración
router.use(validateJWT);

// Ruta para crear un nuevo usuario (solo administradores)
router.post('/usuarios', 
    crearUsuarioRules, 
    crearUsuario
);

// Ruta para listar usuarios (solo administradores)
router.get('/usuarios', listarUsuarios);

// Ruta para actualizar el estado de un usuario (solo administradores)
router.put('/usuarios/:userId/estado', actualizarEstadoUsuario);

export default router;
