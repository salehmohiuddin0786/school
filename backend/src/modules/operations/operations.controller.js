import {
  createTransportRoute,
  listTransportRoutes,
  registerVehicle,
  listVehicles,
  catalogLibraryBook,
  listLibraryBooks,
  issueLibraryBook,
  returnLibraryBook,
  addInventoryItem,
  listInventoryItems,
  adjustInventoryStock,
} from './operations.service.js';
import {
  createRouteSchema,
  registerVehicleSchema,
  catalogBookSchema,
  issueBookSchema,
  returnBookSchema,
  addInventorySchema,
  adjustStockSchema,
} from './operations.schema.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

// Transport
export async function createRouteController(req, res, next) {
  try {
    const validated = createRouteSchema.parse(req.body);
    const route = await createTransportRoute(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, route, 'Transport route created successfully');
  } catch (error) {
    next(error);
  }
}

export async function listRoutesController(req, res, next) {
  try {
    const routes = await listTransportRoutes(req.tenantId);
    return sendSuccess(res, routes, 'Transport routes retrieved');
  } catch (error) {
    next(error);
  }
}

export async function registerVehicleController(req, res, next) {
  try {
    const validated = registerVehicleSchema.parse(req.body);
    const vehicle = await registerVehicle(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, vehicle, 'Vehicle registered successfully');
  } catch (error) {
    next(error);
  }
}

export async function listVehiclesController(req, res, next) {
  try {
    const vehicles = await listVehicles(req.tenantId);
    return sendSuccess(res, vehicles, 'Vehicles retrieved');
  } catch (error) {
    next(error);
  }
}

// Library
export async function catalogBookController(req, res, next) {
  try {
    const validated = catalogBookSchema.parse(req.body);
    const book = await catalogLibraryBook(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, book, 'Library book cataloged successfully');
  } catch (error) {
    next(error);
  }
}

export async function listBooksController(req, res, next) {
  try {
    const { search } = req.query;
    const books = await listLibraryBooks(req.tenantId, search);
    return sendSuccess(res, books, 'Library books retrieved');
  } catch (error) {
    next(error);
  }
}

export async function issueBookController(req, res, next) {
  try {
    const validated = issueBookSchema.parse(req.body);
    const result = await issueLibraryBook(req.tenantId, validated, req.user?.id, req);
    return sendSuccess(res, result, 'Library book issued successfully');
  } catch (error) {
    next(error);
  }
}

export async function returnBookController(req, res, next) {
  try {
    const { issueId } = req.params;
    const validated = returnBookSchema.parse(req.body || {});
    const result = await returnLibraryBook(req.tenantId, issueId, validated, req.user?.id, req);
    return sendSuccess(res, result, 'Library book return processed successfully');
  } catch (error) {
    next(error);
  }
}

// Inventory
export async function addInventoryController(req, res, next) {
  try {
    const validated = addInventorySchema.parse(req.body);
    const item = await addInventoryItem(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, item, 'Inventory item added successfully');
  } catch (error) {
    next(error);
  }
}

export async function listInventoryController(req, res, next) {
  try {
    const items = await listInventoryItems(req.tenantId);
    return sendSuccess(res, items, 'Inventory items retrieved');
  } catch (error) {
    next(error);
  }
}

export async function adjustStockController(req, res, next) {
  try {
    const { itemId } = req.params;
    const validated = adjustStockSchema.parse(req.body);
    const result = await adjustInventoryStock(req.tenantId, itemId, validated, req.user?.id, req);
    return sendSuccess(res, result, 'Inventory stock adjusted successfully');
  } catch (error) {
    next(error);
  }
}
