import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

export async function createAssignment(tenantId, data, currentUserId = null, req = null) {
  const classSubject = await prisma.classSubject.findFirst({
    where: { id: data.classSubjectId, tenantId },
    include: { subject: true, section: true },
  });
  if (!classSubject) throw new Error('Class Subject not found.');

  let teacherProfileId = data.teacherProfileId;
  if (!teacherProfileId) {
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { userId: currentUserId, tenantId },
    });
    if (!teacherProfile) {
      throw new Error('Teacher profile not found for the user creating this assignment.');
    }
    teacherProfileId = teacherProfile.id;
  } else {
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { id: teacherProfileId, tenantId },
    });
    if (!teacherProfile) throw new Error('Teacher profile not found.');
  }

  const assignment = await prisma.assignment.create({
    data: {
      tenantId,
      classSubjectId: data.classSubjectId,
      teacherProfileId,
      title: data.title,
      description: data.description || null,
      dueDate: new Date(data.dueDate),
      maxMarks: data.maxMarks,
      attachmentUrl: data.attachmentUrl || null,
    },
    include: {
      classSubject: {
        include: {
          subject: true,
          section: true,
        },
      },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  await logAudit({
    tenantId,
    userId: currentUserId,
    action: 'CREATE_ASSIGNMENT',
    entityType: 'ASSIGNMENT',
    entityId: assignment.id,
    newValues: { title: assignment.title, dueDate: assignment.dueDate },
    req,
  });

  return assignment;
}

export async function listAssignments(tenantId, { classSubjectId, teacherProfileId, studentId } = {}) {
  const where = { tenantId };
  if (classSubjectId) where.classSubjectId = classSubjectId;
  if (teacherProfileId) where.teacherProfileId = teacherProfileId;

  return prisma.assignment.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    include: {
      classSubject: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          section: { select: { id: true, name: true } },
        },
      },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      submissions: studentId
        ? {
            where: { studentId },
            select: { id: true, status: true, marksAwarded: true, submittedAt: true },
          }
        : false,
      _count: {
        select: { submissions: true },
      },
    },
  });
}

export async function getAssignmentById(id, tenantId) {
  return prisma.assignment.findFirst({
    where: { id, tenantId },
    include: {
      classSubject: {
        include: {
          subject: true,
          section: true,
        },
      },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });
}

export async function submitAssignment(tenantId, assignmentId, studentId, data, req = null) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, tenantId },
  });
  if (!assignment) throw new Error('Assignment not found.');

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId },
    include: { user: true },
  });
  if (!student) throw new Error('Student profile not found.');

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      tenantId_assignmentId_studentId: {
        tenantId,
        assignmentId,
        studentId,
      },
    },
    update: {
      submissionText: data.submissionText || null,
      fileUrl: data.fileUrl || null,
      submittedAt: new Date(),
      status: 'SUBMITTED',
    },
    create: {
      tenantId,
      assignmentId,
      studentId,
      submissionText: data.submissionText || null,
      fileUrl: data.fileUrl || null,
      status: 'SUBMITTED',
    },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  await logAudit({
    tenantId,
    userId: student.userId,
    action: 'SUBMIT_ASSIGNMENT',
    entityType: 'ASSIGNMENT_SUBMISSION',
    entityId: submission.id,
    newValues: { assignmentId, studentId },
    req,
  });

  return submission;
}

export async function listSubmissions(tenantId, assignmentId) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, tenantId },
  });
  if (!assignment) throw new Error('Assignment not found.');

  return prisma.assignmentSubmission.findMany({
    where: { tenantId, assignmentId },
    orderBy: { submittedAt: 'desc' },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
}

export async function gradeSubmission(tenantId, submissionId, data, graderUserId = null, req = null) {
  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId, tenantId },
    include: { assignment: true },
  });
  if (!submission) throw new Error('Submission not found.');

  const maxAllowed = Number(submission.assignment.maxMarks);
  if (Number(data.marksAwarded) > maxAllowed) {
    throw new Error(`Marks awarded (${data.marksAwarded}) cannot exceed maximum allowed marks (${maxAllowed}).`);
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      marksAwarded: data.marksAwarded,
      feedback: data.feedback || null,
      status: data.status || 'GRADED',
    },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      assignment: { select: { title: true, maxMarks: true } },
    },
  });

  await logAudit({
    tenantId,
    userId: graderUserId,
    action: 'GRADE_SUBMISSION',
    entityType: 'ASSIGNMENT_SUBMISSION',
    entityId: submissionId,
    newValues: { marksAwarded: data.marksAwarded, status: data.status },
    req,
  });

  return updated;
}

export async function createLearningMaterial(tenantId, data, currentUserId = null, req = null) {
  const classSubject = await prisma.classSubject.findFirst({
    where: { id: data.classSubjectId, tenantId },
  });
  if (!classSubject) throw new Error('Class Subject not found.');

  let teacherProfileId = data.teacherProfileId;
  if (!teacherProfileId) {
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { userId: currentUserId, tenantId },
    });
    if (!teacherProfile) {
      throw new Error('Teacher profile not found for the user creating this learning material.');
    }
    teacherProfileId = teacherProfile.id;
  }

  const material = await prisma.learningMaterial.create({
    data: {
      tenantId,
      classSubjectId: data.classSubjectId,
      teacherProfileId,
      title: data.title,
      description: data.description || null,
      fileUrl: data.fileUrl,
      fileType: data.fileType || 'PDF',
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    },
    include: {
      classSubject: {
        include: {
          subject: true,
          section: true,
        },
      },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  await logAudit({
    tenantId,
    userId: currentUserId,
    action: 'CREATE_LEARNING_MATERIAL',
    entityType: 'LEARNING_MATERIAL',
    entityId: material.id,
    newValues: { title: material.title, fileType: material.fileType },
    req,
  });

  return material;
}

export async function listLearningMaterials(tenantId, { classSubjectId } = {}) {
  const where = { tenantId, isPublished: true };
  if (classSubjectId) where.classSubjectId = classSubjectId;

  return prisma.learningMaterial.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      classSubject: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          section: { select: { id: true, name: true } },
        },
      },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
}
