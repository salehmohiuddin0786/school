import { Router } from 'express';
import {
  createRouteController,
  listRoutesController,
  registerVehicleController,
  listVehiclesController,
  catalogBookController,
  listBooksController,
  issueBookController,
  returnBookController,
  addInventoryController,
  listInventoryController,
  adjustStockController,
} from './operations.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Transport Routes & Vehicles
router.get('/transport/routes', listRoutesController);
router.post('/transport/routes', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), createRouteController);

router.get('/transport/vehicles', listVehiclesController);
router.post('/transport/vehicles', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), registerVehicleController);

// Library Catalog & Circulation
router.get('/library/books', listBooksController);
router.post('/library/books', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'SUPER_ADMIN'), catalogBookController);
router.post('/library/issue', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'SUPER_ADMIN'), issueBookController);
router.post('/library/return/:issueId', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'SUPER_ADMIN'), returnBookController);

// Inventory & Assets
router.get('/inventory', listInventoryController);
router.post('/inventory', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), addInventoryController);
router.post('/inventory/:itemId/adjust', requireRole('SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'), adjustStockController);

export default router;
