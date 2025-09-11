// routes/permisos.routes.ts
import express from "express";
import { listarPermisos } from "../controllers/permisos.controller.js"

const router = express.Router();

// GET permisos
router.get("/", listarPermisos);

export default router;
