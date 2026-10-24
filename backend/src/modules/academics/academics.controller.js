import {
  listAcademicYears,
  getCurrentAcademicYear,
  createAcademicYear,
  setCurrentAcademicYear,
  updateAcademicYear,
  listDepartments,
  createDepartment,
  updateDepartment,
  listCourses,
  createCourse,
  updateCourse,
  listSections,
  getSectionById,
  createSection,
  updateSection,
  listSubjects,
  createSubject,
  updateSubject,
  linkClassSubject,
} from './academics.service.js';
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createCourseSchema,
  updateCourseSchema,
  createSectionSchema,
  updateSectionSchema,
  createSubjectSchema,
  updateSubjectSchema,
  linkClassSubjectSchema,
} from './academics.schema.js';
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js';

// Academic Years
export async function getAcademicYears(req, res, next) {
  try {
    const years = await listAcademicYears(req.tenantId);
    return sendSuccess(res, years, 'Academic years retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getCurrentYear(req, res, next) {
  try {
    const current = await getCurrentAcademicYear(req.tenantId);
    if (!current) {
      return sendError(res, 'No current academic year is active.', 404);
    }
    return sendSuccess(res, current, 'Current academic year retrieved');
  } catch (error) {
    next(error);
  }
}

export async function addAcademicYear(req, res, next) {
  try {
    const validated = createAcademicYearSchema.parse(req.body);
    const year = await createAcademicYear(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, year, 'Academic year created successfully');
  } catch (error) {
    next(error);
  }
}

export async function makeCurrentAcademicYear(req, res, next) {
  try {
    const { id } = req.params;
    const year = await setCurrentAcademicYear(id, req.tenantId, req.user.id, req);
    return sendSuccess(res, year, 'Academic year set as current');
  } catch (error) {
    next(error);
  }
}

export async function editAcademicYear(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateAcademicYearSchema.parse(req.body);
    const year = await updateAcademicYear(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, year, 'Academic year updated');
  } catch (error) {
    next(error);
  }
}

// Departments
export async function getDepartments(req, res, next) {
  try {
    const { campusId } = req.query;
    const depts = await listDepartments(req.tenantId, campusId);
    return sendSuccess(res, depts, 'Departments retrieved');
  } catch (error) {
    next(error);
  }
}

export async function addDepartment(req, res, next) {
  try {
    const validated = createDepartmentSchema.parse(req.body);
    const dept = await createDepartment(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, dept, 'Department created');
  } catch (error) {
    next(error);
  }
}

export async function editDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateDepartmentSchema.parse(req.body);
    const dept = await updateDepartment(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, dept, 'Department updated');
  } catch (error) {
    next(error);
  }
}

// Courses
export async function getCourses(req, res, next) {
  try {
    const { departmentId } = req.query;
    const courses = await listCourses(req.tenantId, departmentId);
    return sendSuccess(res, courses, 'Courses retrieved');
  } catch (error) {
    next(error);
  }
}

export async function addCourse(req, res, next) {
  try {
    const validated = createCourseSchema.parse(req.body);
    const course = await createCourse(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, course, 'Course created');
  } catch (error) {
    next(error);
  }
}

export async function editCourse(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateCourseSchema.parse(req.body);
    const course = await updateCourse(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, course, 'Course updated');
  } catch (error) {
    next(error);
  }
}

// Sections
export async function getSections(req, res, next) {
  try {
    const { courseId, academicYearId } = req.query;
    const sections = await listSections(req.tenantId, { courseId, academicYearId });
    return sendSuccess(res, sections, 'Sections retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getSection(req, res, next) {
  try {
    const { id } = req.params;
    const section = await getSectionById(id, req.tenantId);
    if (!section) return sendError(res, 'Section not found', 404);
    return sendSuccess(res, section, 'Section details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function addSection(req, res, next) {
  try {
    const validated = createSectionSchema.parse(req.body);
    const section = await createSection(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, section, 'Section created');
  } catch (error) {
    next(error);
  }
}

export async function editSection(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateSectionSchema.parse(req.body);
    const section = await updateSection(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, section, 'Section updated');
  } catch (error) {
    next(error);
  }
}

// Subjects
export async function getSubjects(req, res, next) {
  try {
    const { departmentId } = req.query;
    const subjects = await listSubjects(req.tenantId, departmentId);
    return sendSuccess(res, subjects, 'Subjects retrieved');
  } catch (error) {
    next(error);
  }
}

export async function addSubject(req, res, next) {
  try {
    const validated = createSubjectSchema.parse(req.body);
    const subject = await createSubject(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, subject, 'Subject created');
  } catch (error) {
    next(error);
  }
}

export async function editSubject(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateSubjectSchema.parse(req.body);
    const subject = await updateSubject(id, req.tenantId, validated, req.user.id, req);
    return sendSuccess(res, subject, 'Subject updated');
  } catch (error) {
    next(error);
  }
}

// Class Subjects
export async function addClassSubject(req, res, next) {
  try {
    const validated = linkClassSubjectSchema.parse(req.body);
    const linked = await linkClassSubject(req.tenantId, validated, req.user.id, req);
    return sendCreated(res, linked, 'Subject assigned to class section successfully');
  } catch (error) {
    next(error);
  }
}
