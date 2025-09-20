import { Router } from 'express';
import { 
    crearUsuario, 
    listarUsuarios, 
    actualizarEstadoUsuario 
} from '../controllers/admin.controller.js';
import { crearUsuarioRules } from '../validators/usuarioValidator.js';
import { validateJWT } from '../middlewares/validateJWT.js';
import { listarPermisosUsuario } from '../controllers/permisos.controller.js';

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

// GET: permisos de un usuario
router.get("/:id/permisos", listarPermisosUsuario);

export default router;
