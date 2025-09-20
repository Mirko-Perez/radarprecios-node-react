import express from 'express';
import { 
  getPriceAveragesByRegion,
  getPriceStatistics,
  getProductsByBrandAndRegion,
  getStoresByRegion,
  getPriceTrend,
  getMostExpensiveProducts,
  getCheapestProducts,
  getMostExpensiveBrands,
  getCheapestBrands,
  addPrice,
  getAveragePricesByRegion,
  getAveragePricesByProductAndGroup
} from '../controllers/prices.controller.js';

const router = express.Router();

// Product routes
router.get('/products/:brand_id/:region_id', getProductsByBrandAndRegion);
router.get('/stores/:region_id', getStoresByRegion);

// Price analysis routes
router.get('/averages-by-region', getPriceAveragesByRegion);
router.get('/average-by-region', getAveragePricesByRegion);
router.get('/averages-by-product-group', getAveragePricesByProductAndGroup);
router.get('/trend', getPriceTrend);
router.get('/most-expensive', getMostExpensiveProducts);
router.get('/cheapest', getCheapestProducts);
router.get('/statistics', getPriceStatistics);
router.get('/most-expensive-brands', getMostExpensiveBrands);
router.get('/cheapest-brands', getCheapestBrands);

// Add price
router.post('/', addPrice);

export default router;
