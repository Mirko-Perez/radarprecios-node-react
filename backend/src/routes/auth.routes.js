import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validateLogin } from '../middlewares/validation.js';

const router = express.Router();

router.post('/login', validateLogin, authController.login);

export default router;
