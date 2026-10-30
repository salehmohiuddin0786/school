import {
  createNotice,
  listNotices,
  getNoticeById,
} from './notices.service.js';
import { createNoticeSchema } from './notices.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';

export async function createNoticeController(req, res, next) {
  try {
    const validated = createNoticeSchema.parse(req.body);
    const notice = await createNotice(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, notice, 'Notice published successfully');
  } catch (error) {
    next(error);
  }
}

export async function listNoticesController(req, res, next) {
  try {
    let audience = null;
    const roles = req.roles || [];

    if (roles.includes('STUDENT')) {
      audience = ['ALL', 'STUDENTS'];
    } else if (roles.includes('PARENT')) {
      audience = ['ALL', 'PARENTS'];
    } else if (roles.includes('TEACHER')) {
      audience = ['ALL', 'TEACHERS', 'STAFF'];
    }

    const notices = await listNotices(req.tenantId, { audience });
    return sendSuccess(res, notices, 'Notices retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getNoticeController(req, res, next) {
  try {
    const { id } = req.params;
    const notice = await getNoticeById(id, req.tenantId);
    if (!notice) {
      return sendError(res, 'Notice not found in your institution.', 404);
    }
    return sendSuccess(res, notice, 'Notice retrieved');
  } catch (error) {
    next(error);
  }
}
