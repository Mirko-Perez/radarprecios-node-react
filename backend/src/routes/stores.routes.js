import express from 'express';
import { getStoresByRegion, addStore, listarComercios, getStoreById, updateStore, deleteStore } from '../controllers/stores.controller.js';

const router = express.Router();

router.get('/region/:region_id', getStoresByRegion);
router.post('/', addStore);
router.get("/", listarComercios);
router.get("/:id", getStoreById);
router.patch("/:id", updateStore); 
router.delete("/:id", deleteStore);

export default router;