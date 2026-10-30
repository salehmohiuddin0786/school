import {
  listParents,
  getParentById,
  createParent,
  linkStudentToParent,
  getLinkedChildrenForParentUser,
  getChildDashboardOverview,
} from './parent.service.js';
import {
  createParentSchema,
  updateParentSchema,
  linkStudentSchema,
} from './parent.schema.js';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '../../utils/response.js';

export async function getAllParents(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const { parents, total } = await listParents(req.tenantId, { search, page, limit });
    return sendPaginated(res, parents, total, page, limit, 'Parents retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getParent(req, res, next) {
  try {
    const { id } = req.params;
    const parent = await getParentById(id, req.tenantId);
    if (!parent) return sendError(res, 'Parent profile not found', 404);
    return sendSuccess(res, parent, 'Parent profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function addParent(req, res, next) {
  try {
    const validated = createParentSchema.parse(req.body);
    const parent = await createParent(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, parent, 'Parent registered successfully');
  } catch (error) {
    next(error);
  }
}

export async function linkChild(req, res, next) {
  try {
    const { id } = req.params; // parentProfileId
    const validated = linkStudentSchema.parse(req.body);
    const linked = await linkStudentToParent(req.tenantId, id, validated, req.user.id, req);
    return sendCreated(res, linked, 'Child linked to parent profile successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMyChildren(req, res, next) {
  try {
    const children = await getLinkedChildrenForParentUser(req.tenantId, req.user.id);
    return sendSuccess(res, children, 'Linked children retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getChildDashboard(req, res, next) {
  try {
    const { studentId } = req.params;
    const overview = await getChildDashboardOverview(req.tenantId, req.user.id, studentId);
    return sendSuccess(res, overview, 'Child dashboard overview retrieved');
  } catch (error) {
    next(error);
  }
}
