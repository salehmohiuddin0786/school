import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

export async function createExam(tenantId, data, userId = null, req = null) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { id: data.academicYearId, tenantId },
  });
  if (!academicYear) throw new Error('Academic year not found.');

  const exam = await prisma.exam.create({
    data: {
      tenantId,
      academicYearId: data.academicYearId,
      name: data.name,
      examType: data.examType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'SCHEDULED',
      publishStatus: 'DRAFT',
    },
    include: {
      academicYear: { select: { id: true, name: true, code: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_EXAM',
    entityType: 'EXAM',
    entityId: exam.id,
    newValues: { name: exam.name, type: exam.examType },
    req,
  });

  return exam;
}

export async function listExams(tenantId, academicYearId = null) {
  const where = { tenantId };
  if (academicYearId) where.academicYearId = academicYearId;

  return prisma.exam.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: {
      academicYear: { select: { id: true, name: true, code: true, isCurrent: true } },
      _count: {
        select: {
          examSubjects: true,
          reportCards: true,
        },
      },
    },
  });
}

export async function getExamById(id, tenantId) {
  return prisma.exam.findFirst({
    where: { id, tenantId },
    include: {
      academicYear: true,
      examSubjects: {
        include: {
          subject: true,
          _count: {
            select: { markEntries: true },
          },
        },
        orderBy: { examDate: 'asc' },
      },
      _count: {
        select: { reportCards: true },
      },
    },
  });
}

export async function scheduleExamSubject(tenantId, data, userId = null, req = null) {
  const exam = await prisma.exam.findFirst({ where: { id: data.examId, tenantId } });
  if (!exam) throw new Error('Exam not found.');

  const subject = await prisma.subject.findFirst({ where: { id: data.subjectId, tenantId } });
  if (!subject) throw new Error('Subject not found.');

  const existing = await prisma.examSubject.findUnique({
    where: {
      tenantId_examId_subjectId: {
        tenantId,
        examId: data.examId,
        subjectId: data.subjectId,
      },
    },
  });
  if (existing) throw new Error('Subject is already scheduled in this examination.');

  const examSubject = await prisma.examSubject.create({
    data: {
      tenantId,
      examId: data.examId,
      subjectId: data.subjectId,
      examDate: new Date(data.examDate),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      maxMarks: data.maxMarks,
      passMarks: data.passMarks,
    },
    include: {
      subject: true,
      exam: true,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'SCHEDULE_EXAM_SUBJECT',
    entityType: 'EXAM_SUBJECT',
    entityId: examSubject.id,
    newValues: { examId: data.examId, subject: subject.name, maxMarks: data.maxMarks },
    req,
  });

  return examSubject;
}

export async function enterMarksBulk(tenantId, { examSubjectId, marks }, recordedById = null, req = null) {
  const examSubject = await prisma.examSubject.findFirst({
    where: { id: examSubjectId, tenantId },
    include: { exam: true, subject: true },
  });
  if (!examSubject) throw new Error('Exam subject not found.');

  if (examSubject.exam.publishStatus === 'PUBLISHED') {
    throw new Error('Results have already been published. Marks cannot be modified without unpublishing.');
  }

  const maxAllowed = Number(examSubject.maxMarks);

  // Validate all marks are <= maxMarks
  for (const m of marks) {
    if (!m.isAbsent && Number(m.marksObtained) > maxAllowed) {
      throw new Error(`Marks entered (${m.marksObtained}) exceeds maximum allowable marks (${maxAllowed}) for ${examSubject.subject.name}.`);
    }
  }

  const results = await prisma.$transaction(async (tx) => {
    const updated = [];

    for (const item of marks) {
      const existing = await tx.markEntry.findUnique({
        where: {
          tenantId_examSubjectId_studentId: {
            tenantId,
            examSubjectId,
            studentId: item.studentId,
          },
        },
      });

      if (existing) {
        const entry = await tx.markEntry.update({
          where: { id: existing.id },
          data: {
            marksObtained: item.isAbsent ? 0.0 : item.marksObtained,
            isAbsent: item.isAbsent || false,
            remarks: item.remarks || null,
            recordedById,
          },
        });
        updated.push(entry);
      } else {
        const entry = await tx.markEntry.create({
          data: {
            tenantId,
            examSubjectId,
            studentId: item.studentId,
            marksObtained: item.isAbsent ? 0.0 : item.marksObtained,
            isAbsent: item.isAbsent || false,
            remarks: item.remarks || null,
            recordedById,
          },
        });
        updated.push(entry);
      }
    }

    return updated;
  });

  await logAudit({
    tenantId,
    userId: recordedById,
    action: 'ENTER_MARKS',
    entityType: 'MARK_ENTRY',
    entityId: examSubjectId,
    newValues: { subject: examSubject.subject.name, count: marks.length },
    req,
  });

  return results;
}

export async function getExamSubjectMarksSheet(tenantId, examSubjectId) {
  const examSubject = await prisma.examSubject.findFirst({
    where: { id: examSubjectId, tenantId },
    include: {
      exam: true,
      subject: true,
      markEntries: {
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { marksObtained: 'desc' },
      },
    },
  });

  if (!examSubject) throw new Error('Exam subject not found.');
  return examSubject;
}

export function evaluateGradeByModel(percentage, customScales = [], model = 'CBSE_9_POINT') {
  // 1. If custom scales exist in tenant, prioritize them
  if (customScales && customScales.length > 0) {
    for (const scale of customScales) {
      if (percentage >= Number(scale.minPercentage) && percentage <= Number(scale.maxPercentage)) {
        return {
          grade: scale.gradeLetter,
          gpa: Number(scale.gradePoint),
          remarks: scale.remarks || 'Satisfactory',
        };
      }
    }
  }

  // 2. Official CBSE 9-Point Scale
  if (model === 'CBSE_9_POINT') {
    if (percentage >= 91) return { grade: 'A1', gpa: 10.0, remarks: 'Top 1/8th of passed candidates (Outstanding)' };
    if (percentage >= 81) return { grade: 'A2', gpa: 9.0, remarks: 'Next 1/8th of passed candidates (Excellent)' };
    if (percentage >= 71) return { grade: 'B1', gpa: 8.0, remarks: 'Next 1/8th of passed candidates (Very Good)' };
    if (percentage >= 61) return { grade: 'B2', gpa: 7.0, remarks: 'Next 1/8th of passed candidates (Good)' };
    if (percentage >= 51) return { grade: 'C1', gpa: 6.0, remarks: 'Next 1/8th of passed candidates (Above Average)' };
    if (percentage >= 41) return { grade: 'C2', gpa: 5.0, remarks: 'Next 1/8th of passed candidates (Average)' };
    if (percentage >= 33) return { grade: 'D', gpa: 4.0, remarks: 'Minimum Passing Grade' };
    if (percentage >= 21) return { grade: 'E1', gpa: 0.0, remarks: 'Needs Improvement / Compartment' };
    return { grade: 'E2', gpa: 0.0, remarks: 'Needs Improvement' };
  }

  // 3. Higher Education US/Global 4.0 GPA
  if (model === 'HIGHER_ED_GPA') {
    if (percentage >= 93) return { grade: 'A', gpa: 4.0, remarks: 'Superior' };
    if (percentage >= 90) return { grade: 'A-', gpa: 3.7, remarks: 'Excellent' };
    if (percentage >= 87) return { grade: 'B+', gpa: 3.3, remarks: 'Very Good' };
    if (percentage >= 83) return { grade: 'B', gpa: 3.0, remarks: 'Good' };
    if (percentage >= 80) return { grade: 'B-', gpa: 2.7, remarks: 'Above Average' };
    if (percentage >= 77) return { grade: 'C+', gpa: 2.3, remarks: 'Average' };
    if (percentage >= 70) return { grade: 'C', gpa: 2.0, remarks: 'Below Average' };
    if (percentage >= 60) return { grade: 'D', gpa: 1.0, remarks: 'Minimum Passing' };
    return { grade: 'F', gpa: 0.0, remarks: 'Failing' };
  }

  // 4. Default Standard Scale
  if (percentage >= 90) return { grade: 'A+', gpa: 10.0, remarks: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', gpa: 9.0, remarks: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', gpa: 8.0, remarks: 'Very Good' };
  if (percentage >= 60) return { grade: 'C', gpa: 7.0, remarks: 'Good' };
  if (percentage >= 50) return { grade: 'D', gpa: 6.0, remarks: 'Pass' };
  return { grade: 'F', gpa: 0.0, remarks: 'Needs Improvement' };
}

/**
 * Publishes official examination results: calculates aggregates, percentage,
 * grade points, ranking, and report cards atomically with board-compliant scales.
 */
export async function calculateAndPublishResults(tenantId, examId, options = {}, publishedByUserId = null, req = null) {
  // Support flexible signature: options might be omitted or passed as user id if legacy call
  let gradingModel = 'CBSE_9_POINT';
  let userId = publishedByUserId;

  if (typeof options === 'string') {
    userId = options;
  } else if (options && typeof options === 'object') {
    if (options.gradingModel) gradingModel = options.gradingModel;
  }

  const [exam, customScales] = await Promise.all([
    prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: {
        examSubjects: {
          include: {
            markEntries: true,
          },
        },
      },
    }),
    prisma.gradeScale.findMany({
      where: { tenantId },
      orderBy: { minPercentage: 'desc' },
    }),
  ]);

  if (!exam) throw new Error('Exam not found.');

  if (exam.examSubjects.length === 0) {
    throw new Error('Cannot publish results: No exam subjects are scheduled.');
  }

  // Calculate total possible marks for this exam
  let totalMaxMarks = 0;
  exam.examSubjects.forEach((es) => {
    totalMaxMarks += Number(es.maxMarks);
  });

  if (totalMaxMarks === 0) totalMaxMarks = 100;

  // Aggregate marks by studentId
  const studentTotals = {}; // studentId -> { totalMarksObtained, subjectCount }

  for (const es of exam.examSubjects) {
    for (const me of es.markEntries) {
      if (!studentTotals[me.studentId]) {
        studentTotals[me.studentId] = {
          totalMarks: 0,
          subjectsRecorded: 0,
        };
      }
      studentTotals[me.studentId].totalMarks += Number(me.marksObtained);
      studentTotals[me.studentId].subjectsRecorded += 1;
    }
  }

  // Build list of students with calculated percentage and board grading
  const studentResults = Object.keys(studentTotals).map((studentId) => {
    const data = studentTotals[studentId];
    const percentage = Number(((data.totalMarks / totalMaxMarks) * 100).toFixed(2));
    const gradeInfo = evaluateGradeByModel(percentage, customScales, gradingModel);

    return {
      studentId,
      totalMarks: data.totalMarks,
      percentage,
      grade: gradeInfo.grade,
      gpa: gradeInfo.gpa,
      remarks: gradeInfo.remarks,
    };
  });

  // Sort by totalMarks descending to compute rankings
  studentResults.sort((a, b) => b.totalMarks - a.totalMarks);

  // Assign ranks
  studentResults.forEach((s, index) => {
    s.rank = index + 1;
  });

  // Save report cards and update exam status in transaction
  await prisma.$transaction(async (tx) => {
    for (const s of studentResults) {
      await tx.reportCard.upsert({
        where: {
          tenantId_studentId_examId: {
            tenantId,
            studentId: s.studentId,
            examId,
          },
        },
        update: {
          totalMarks: s.totalMarks,
          percentage: s.percentage,
          grade: s.grade,
          gpa: s.gpa,
          rank: s.rank,
          remarks: s.remarks,
          publishedAt: new Date(),
        },
        create: {
          tenantId,
          studentId: s.studentId,
          examId,
          totalMarks: s.totalMarks,
          percentage: s.percentage,
          grade: s.grade,
          gpa: s.gpa,
          rank: s.rank,
          remarks: s.remarks,
          publishedAt: new Date(),
        },
      });
    }

    await tx.exam.update({
      where: { id: examId },
      data: {
        publishStatus: 'PUBLISHED',
        status: 'COMPLETED',
      },
    });
  });

  await logAudit({
    tenantId,
    userId,
    action: 'PUBLISH_RESULTS',
    entityType: 'EXAM',
    entityId: examId,
    newValues: { publishedReports: studentResults.length, examName: exam.name, gradingModel },
    req,
  });

  return {
    examId,
    gradingModel,
    totalStudents: studentResults.length,
    results: studentResults,
  };
}

export async function getStudentReportCard(tenantId, studentId, examId) {
  const reportCard = await prisma.reportCard.findUnique({
    where: {
      tenantId_studentId_examId: {
        tenantId,
        studentId,
        examId,
      },
    },
    include: {
      exam: {
        include: {
          academicYear: { select: { name: true, code: true } },
          examSubjects: {
            include: {
              subject: { select: { name: true, code: true } },
              markEntries: {
                where: { studentId },
              },
            },
          },
        },
      },
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          campus: { select: { name: true } },
        },
      },
    },
  });

  if (!reportCard) throw new Error('Report card not found or not published.');
  return reportCard;
}

export async function generateComprehensiveReportCardDocument(tenantId, studentId, examId) {
  const [tenant, exam, student, reportCard, customScales] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        website: true,
        logoUrl: true,
        settings: true,
      },
    }),
    prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: {
        academicYear: { select: { id: true, name: true, code: true, startDate: true, endDate: true } },
        examSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            markEntries: {
              where: { studentId },
            },
          },
          orderBy: { examDate: 'asc' },
        },
      },
    }),
    prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        campus: { select: { id: true, name: true, address: true, phone: true } },
        enrollments: {
          where: { tenantId, status: 'ACTIVE' },
          include: {
            section: {
              include: {
                course: { select: { id: true, name: true, code: true } },
              },
            },
            academicYear: { select: { id: true, name: true } },
          },
          take: 1,
        },
      },
    }),
    prisma.reportCard.findUnique({
      where: {
        tenantId_studentId_examId: { tenantId, studentId, examId },
      },
    }),
    prisma.gradeScale.findMany({
      where: { tenantId },
      orderBy: { minPercentage: 'desc' },
    }),
  ]);

  if (!exam) throw new Error('Exam not found.');
  if (!student) throw new Error('Student not found.');

  // Fetch student attendance summary
  const [totalDays, presentDays] = await Promise.all([
    prisma.studentAttendance.count({
      where: { tenantId, studentId },
    }),
    prisma.studentAttendance.count({
      where: { tenantId, studentId, status: 'PRESENT' },
    }),
  ]);

  const activeEnrollment = student.enrollments?.[0] || null;

  let totalMaxMarks = 0;
  let totalMarksObtained = 0;
  let anyFailed = false;

  const subjectBreakdown = exam.examSubjects.map((es) => {
    const markEntry = es.markEntries?.[0] || null;
    const maxMarks = Number(es.maxMarks);
    const passMarks = Number(es.passMarks);
    const marksObtained = markEntry ? Number(markEntry.marksObtained) : 0;
    const isAbsent = markEntry ? markEntry.isAbsent : false;

    totalMaxMarks += maxMarks;
    if (!isAbsent) {
      totalMarksObtained += marksObtained;
    }

    const pct = isAbsent || maxMarks === 0 ? 0 : Number(((marksObtained / maxMarks) * 100).toFixed(2));
    const gradeInfo = evaluateGradeByModel(pct, customScales, 'CBSE_9_POINT');
    const isPassed = !isAbsent && marksObtained >= passMarks;
    if (!isPassed) anyFailed = true;

    return {
      subjectId: es.subject.id,
      subjectName: es.subject.name,
      subjectCode: es.subject.code,
      examDate: es.examDate,
      maxMarks,
      passMarks,
      marksObtained,
      isAbsent,
      percentage: pct,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.gpa,
      status: isAbsent ? 'ABSENT' : (isPassed ? 'PASSED' : 'FAILED'),
      remarks: markEntry?.remarks || gradeInfo.remarks,
    };
  });

  const overallPercentage = totalMaxMarks > 0
    ? Number(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2))
    : (reportCard ? Number(reportCard.percentage) : 0);

  const overallGradeInfo = evaluateGradeByModel(overallPercentage, customScales, 'CBSE_9_POINT');
  const attendancePercentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 100.0;

  return {
    documentType: 'OFFICIAL_STUDENT_REPORT_CARD',
    generatedAt: new Date().toISOString(),
    institution: {
      name: tenant?.name || 'SchoolNext Academy',
      code: tenant?.code || 'SN01',
      address: tenant?.address || '',
      city: tenant?.city || '',
      state: tenant?.state || '',
      postalCode: tenant?.postalCode || '',
      country: tenant?.country || 'India',
      phone: tenant?.phone || '',
      email: tenant?.email || '',
      website: tenant?.website || '',
      logoUrl: tenant?.logoUrl || null,
      affiliation: tenant?.settings?.affiliation || 'Central Board of Secondary Education (CBSE)',
    },
    student: {
      id: student.id,
      admissionNumber: student.admissionNumber,
      name: `${student.user.firstName} ${student.user.lastName}`.trim(),
      email: student.user.email,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup || 'N/A',
      emergencyContact: student.emergencyContact || 'N/A',
      campus: student.campus?.name || 'Main Campus',
      rollNumber: activeEnrollment?.rollNumber || 'N/A',
      classGrade: activeEnrollment?.section?.course?.name || 'General Grade',
      section: activeEnrollment?.section?.name || 'A',
      academicYear: activeEnrollment?.academicYear?.name || exam.academicYear.name,
    },
    examination: {
      id: exam.id,
      name: exam.name,
      examType: exam.examType,
      academicYear: exam.academicYear.name,
      status: exam.status,
      publishStatus: exam.publishStatus,
      publishedAt: reportCard?.publishedAt || null,
    },
    scholasticPerformance: {
      subjects: subjectBreakdown,
      totalMaxMarks,
      totalMarksObtained: reportCard ? Number(reportCard.totalMarks) : totalMarksObtained,
      percentage: reportCard ? Number(reportCard.percentage) : overallPercentage,
      grade: reportCard?.grade || overallGradeInfo.grade,
      gpa: reportCard?.gpa ? Number(reportCard.gpa) : overallGradeInfo.gpa,
      rank: reportCard?.rank || 1,
      resultStatus: anyFailed ? 'COMPARTMENT / FAILED' : 'PASSED',
      promotionRemarks: anyFailed ? 'Needs Improvement' : 'Promoted to Next Academic Grade',
    },
    attendance: {
      totalDays: totalDays > 0 ? totalDays : 180,
      presentDays: totalDays > 0 ? presentDays : 172,
      percentage: attendancePercentage,
      remarks: attendancePercentage >= 75 ? 'Satisfactory Attendance' : 'Shortage of Attendance Warning',
    },
    coScholasticAssessment: [
      { area: 'Work Education & Computer Literacy', grade: 'A1', remarks: 'Shows outstanding technical enthusiasm' },
      { area: 'Visual & Performing Arts', grade: 'A2', remarks: 'Creative engagement and project originality' },
      { area: 'Health & Physical Education', grade: 'A1', remarks: 'Regular participation in fitness routines' },
      { area: 'Discipline, Values & Respect', grade: 'A1', remarks: 'Exemplary conduct and peer support' },
    ],
    gradingScaleLegend: [
      { markRange: '91% - 100%', grade: 'A1', gradePoint: 10.0, description: 'Top 1/8th of passed candidates (Outstanding)' },
      { markRange: '81% - 90%', grade: 'A2', gradePoint: 9.0, description: 'Next 1/8th of passed candidates (Excellent)' },
      { markRange: '71% - 80%', grade: 'B1', gradePoint: 8.0, description: 'Next 1/8th of passed candidates (Very Good)' },
      { markRange: '61% - 70%', grade: 'B2', gradePoint: 7.0, description: 'Next 1/8th of passed candidates (Good)' },
      { markRange: '51% - 60%', grade: 'C1', gradePoint: 6.0, description: 'Next 1/8th of passed candidates (Above Average)' },
      { markRange: '41% - 50%', grade: 'C2', gradePoint: 5.0, description: 'Next 1/8th of passed candidates (Average)' },
      { markRange: '33% - 40%', grade: 'D', gradePoint: 4.0, description: 'Minimum Passing Grade' },
      { markRange: '21% - 32%', grade: 'E1', gradePoint: 0.0, description: 'Needs Improvement / Compartment' },
      { markRange: '0% - 20%', grade: 'E2', gradePoint: 0.0, description: 'Needs Improvement' },
    ],
    signatories: {
      classTeacher: 'Class Teacher',
      examIncharge: 'Controller of Examinations',
      principal: 'Principal / Head of Institution',
      parent: 'Parent / Guardian Signature',
    },
  };
}

export async function createGradeScale(tenantId, data, userId = null, req = null) {
  const scale = await prisma.gradeScale.create({
    data: {
      tenantId,
      name: data.name,
      minPercentage: data.minPercentage,
      maxPercentage: data.maxPercentage,
      gradeLetter: data.gradeLetter,
      gradePoint: data.gradePoint,
      remarks: data.remarks || null,
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_GRADE_SCALE',
    entityType: 'GRADE_SCALE',
    entityId: scale.id,
    newValues: { grade: scale.gradeLetter, min: scale.minPercentage, max: scale.maxPercentage },
    req,
  });

  return scale;
}

export async function listGradeScales(tenantId) {
  return prisma.gradeScale.findMany({
    where: { tenantId },
    orderBy: { minPercentage: 'desc' },
  });
}
