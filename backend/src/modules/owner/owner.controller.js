import {
  getOwnerExecutiveOverview,
  getOwnerStudents,
  getOwnerTeachers,
} from './owner.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function getOverview(req, res, next) {
  try {
    const data = await getOwnerExecutiveOverview(req.tenantId);
    return sendSuccess(res, data, 'Owner executive overview retrieved');
  } catch (error) {
    next(error);
  }
}

export async function listStudents(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const data = await getOwnerStudents(req.tenantId, { search, page, limit });
    return sendSuccess(res, data, 'Owner students directory retrieved');
  } catch (error) {
    next(error);
  }
}

export async function listTeachers(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const data = await getOwnerTeachers(req.tenantId, { search, page, limit });
    return sendSuccess(res, data, 'Owner faculty directory retrieved');
  } catch (error) {
    next(error);
  }
}
