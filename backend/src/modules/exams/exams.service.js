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

/**
 * Publishes official examination results: calculates aggregates, percentage,
 * grade points, ranking, and report cards atomically.
 */
export async function calculateAndPublishResults(tenantId, examId, publishedByUserId = null, req = null) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
    include: {
      examSubjects: {
        include: {
          markEntries: true,
        },
      },
    },
  });
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

  // Build list of students with calculated percentage
  const studentResults = Object.keys(studentTotals).map((studentId) => {
    const data = studentTotals[studentId];
    const percentage = Number(((data.totalMarks / totalMaxMarks) * 100).toFixed(2));

    // Grade and GPA assignment
    let grade = 'F';
    let gpa = 0.0;

    if (percentage >= 90) {
      grade = 'A+';
      gpa = 10.0;
    } else if (percentage >= 80) {
      grade = 'A';
      gpa = 9.0;
    } else if (percentage >= 70) {
      grade = 'B';
      gpa = 8.0;
    } else if (percentage >= 60) {
      grade = 'C';
      gpa = 7.0;
    } else if (percentage >= 50) {
      grade = 'D';
      gpa = 6.0;
    } else if (percentage >= 35) {
      grade = 'E';
      gpa = 5.0;
    }

    return {
      studentId,
      totalMarks: data.totalMarks,
      percentage,
      grade,
      gpa,
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
    userId: publishedByUserId,
    action: 'PUBLISH_RESULTS',
    entityType: 'EXAM',
    entityId: examId,
    newValues: { publishedReports: studentResults.length, examName: exam.name },
    req,
  });

  return {
    examId,
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
