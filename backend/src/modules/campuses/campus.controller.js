import {
  listCampuses,
  getCampusById,
  createCampus,
  updateCampus,
} from './campus.service.js';
import { createCampusSchema, updateCampusSchema } from './campus.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';

export async function getAllCampuses(req, res, next) {
  try {
    const { search, isActive } = req.query;
    const campuses = await listCampuses({
      tenantId: req.tenantId,
      search,
      isActive,
    });
    return sendSuccess(res, campuses, 'Campuses retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getCampus(req, res, next) {
  try {
    const { id } = req.params;
    const campus = await getCampusById(id, req.tenantId);
    if (!campus) {
      return sendError(res, 'Campus not found', 404);
    }
    return sendSuccess(res, campus, 'Campus retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function addCampus(req, res, next) {
  try {
    const validated = createCampusSchema.parse(req.body);
    const campus = await createCampus(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, campus, 'Campus created successfully');
  } catch (error) {
    next(error);
  }
}

export async function editCampus(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateCampusSchema.parse(req.body);
    const updated = await updateCampus(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, updated, 'Campus updated successfully');
  } catch (error) {
    next(error);
  }
}
