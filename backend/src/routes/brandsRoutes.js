import express from 'express';
import { getBrands, addBrand, getBrandPriceStats, getBrandsByStore } from '../controllers/brandsController.js';

const router = express.Router();

router.get('/', getBrands);
router.get('/store/:storeId', getBrandsByStore);
router.get('/stats', getBrandPriceStats);
router.post('/', addBrand);

export default router;