import {
  assignSubstitution,
  cancelSubstitution,
  listSubstitutions,
  getEffectiveSectionTimetable,
} from './substitution.service.js';
import {
  createSubstitutionSchema,
  cancelSubstitutionSchema,
} from './substitution.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';

export async function createSubstitutionController(req, res, next) {
  try {
    const validated = createSubstitutionSchema.parse(req.body);
    const result = await assignSubstitution(req.tenantId, validated, req.user?.id, req);
    return sendCreated(res, result, 'Teacher substitution assigned successfully');
  } catch (error) {
    next(error);
  }
}

export async function cancelSubstitutionController(req, res, next) {
  try {
    const { id } = req.params;
    const validated = cancelSubstitutionSchema.parse(req.body || {});
    const result = await cancelSubstitution(req.tenantId, id, req.user?.id, validated.remarks, req);
    return sendSuccess(res, result, 'Teacher substitution cancelled and original timetable restored');
  } catch (error) {
    next(error);
  }
}

export async function listSubstitutionsController(req, res, next) {
  try {
    const { date, status, teacherId } = req.query;
    const results = await listSubstitutions(req.tenantId, { date, status, teacherId });
    return sendSuccess(res, results, 'Substitutions retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getEffectiveTimetableController(req, res, next) {
  try {
    const { sectionId } = req.params;
    const { date = new Date().toISOString().slice(0, 10) } = req.query;
    const timetable = await getEffectiveSectionTimetable(sectionId, date, req.tenantId);
    return sendSuccess(res, timetable, 'Effective daily timetable retrieved');
  } catch (error) {
    next(error);
  }
}
