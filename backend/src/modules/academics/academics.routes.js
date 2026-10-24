import { Router } from 'express';
import {
  getAcademicYears,
  getCurrentYear,
  addAcademicYear,
  makeCurrentAcademicYear,
  editAcademicYear,
  getDepartments,
  addDepartment,
  editDepartment,
  getCourses,
  addCourse,
  editCourse,
  getSections,
  getSection,
  addSection,
  editSection,
  getSubjects,
  addSubject,
  editSubject,
  addClassSubject,
} from './academics.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope, requireTenant } from '../../middleware/tenantScope.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope, requireTenant);

// Academic Years
router.get('/academic-years', getAcademicYears);
router.get('/academic-years/current', getCurrentYear);
router.post('/academic-years', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addAcademicYear);
router.patch('/academic-years/:id/set-current', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), makeCurrentAcademicYear);
router.put('/academic-years/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), editAcademicYear);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addDepartment);
router.put('/departments/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), editDepartment);

// Courses (Classes)
router.get('/courses', getCourses);
router.post('/courses', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addCourse);
router.put('/courses/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), editCourse);

// Sections
router.get('/sections', getSections);
router.get('/sections/:id', getSection);
router.post('/sections', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addSection);
router.put('/sections/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), editSection);

// Subjects
router.get('/subjects', getSubjects);
router.post('/subjects', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addSubject);
router.put('/subjects/:id', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), editSubject);

// Class Subjects
router.post('/class-subjects', requireRole('SCHOOL_ADMIN', 'PRINCIPAL'), addClassSubject);

export default router;
