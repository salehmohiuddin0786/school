import { prisma } from '../../db/prisma.js';
import { logAudit } from '../../utils/audit.js';

// ==========================================
// TRANSPORT MANAGEMENT
// ==========================================

export async function createTransportRoute(tenantId, data, userId = null, req = null) {
  const route = await prisma.transportRoute.create({
    data: {
      tenantId,
      campusId: data.campusId || null,
      routeName: data.routeName,
      startPoint: data.startPoint,
      endPoint: data.endPoint,
      stops: data.stops || [],
      fare: data.fare || 0.0,
    },
    include: {
      campus: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CREATE_TRANSPORT_ROUTE',
    entityType: 'TRANSPORT_ROUTE',
    entityId: route.id,
    newValues: { routeName: route.routeName, start: route.startPoint, end: route.endPoint },
    req,
  });

  return route;
}

export async function listTransportRoutes(tenantId) {
  return prisma.transportRoute.findMany({
    where: { tenantId },
    include: {
      campus: { select: { id: true, name: true } },
      vehicles: {
        select: {
          id: true,
          registrationNumber: true,
          model: true,
          capacity: true,
          driverName: true,
          driverPhone: true,
        },
      },
    },
    orderBy: { routeName: 'asc' },
  });
}

export async function registerVehicle(tenantId, data, userId = null, req = null) {
  const existing = await prisma.vehicle.findUnique({
    where: {
      tenantId_registrationNumber: {
        tenantId,
        registrationNumber: data.registrationNumber,
      },
    },
  });
  if (existing) {
    const err = new Error(`Vehicle registration number '${data.registrationNumber}' already registered in your institution.`);
    err.statusCode = 400;
    throw err;
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId,
      campusId: data.campusId || null,
      routeId: data.routeId || null,
      registrationNumber: data.registrationNumber,
      model: data.model || null,
      capacity: data.capacity || 30,
      driverName: data.driverName || null,
      driverPhone: data.driverPhone || null,
    },
    include: {
      route: { select: { id: true, routeName: true } },
      campus: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'REGISTER_VEHICLE',
    entityType: 'VEHICLE',
    entityId: vehicle.id,
    newValues: { registrationNumber: vehicle.registrationNumber, driver: vehicle.driverName },
    req,
  });

  return vehicle;
}

export async function listVehicles(tenantId) {
  return prisma.vehicle.findMany({
    where: { tenantId },
    include: {
      route: { select: { id: true, routeName: true, startPoint: true, endPoint: true } },
      campus: { select: { id: true, name: true } },
    },
    orderBy: { registrationNumber: 'asc' },
  });
}

// ==========================================
// LIBRARY MANAGEMENT
// ==========================================

export async function catalogLibraryBook(tenantId, data, userId = null, req = null) {
  const copies = Number(data.totalCopies || 1);
  const book = await prisma.libraryBook.create({
    data: {
      tenantId,
      campusId: data.campusId || null,
      isbn: data.isbn || null,
      title: data.title,
      author: data.author,
      publisher: data.publisher || null,
      edition: data.edition || null,
      totalCopies: copies,
      availableCopies: copies,
      rackLocation: data.rackLocation || null,
    },
    include: {
      campus: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'CATALOG_BOOK',
    entityType: 'LIBRARY_BOOK',
    entityId: book.id,
    newValues: { title: book.title, author: book.author, isbn: book.isbn, copies },
    req,
  });

  return book;
}

export async function listLibraryBooks(tenantId, search = null) {
  const where = { tenantId };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
      { isbn: { contains: search } },
    ];
  }

  return prisma.libraryBook.findMany({
    where,
    orderBy: { title: 'asc' },
  });
}

export async function issueLibraryBook(tenantId, data, issuedByUserId = null, req = null) {
  const { bookId, userId, daysAllowed = 14 } = data;

  const book = await prisma.libraryBook.findFirst({
    where: { id: bookId, tenantId },
  });
  if (!book) throw new Error('Book not found.');
  if (book.availableCopies <= 0) {
    throw new Error(`All copies of '${book.title}' are currently issued out.`);
  }

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Number(daysAllowed));

  const [issueRecord, updatedBook] = await prisma.$transaction(async (tx) => {
    const issue = await tx.bookIssue.create({
      data: {
        tenantId,
        bookId,
        userId,
        issueDate,
        dueDate,
        status: 'ISSUED',
        fineAmount: 0.0,
      },
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
      },
    });

    const b = await tx.libraryBook.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    });

    return [issue, b];
  });

  await logAudit({
    tenantId,
    userId: issuedByUserId,
    action: 'ISSUE_BOOK',
    entityType: 'BOOK_ISSUE',
    entityId: issueRecord.id,
    newValues: { bookTitle: book.title, recipientUserId: userId, dueDate },
    req,
  });

  return {
    issueRecord,
    availableCopiesRemaining: updatedBook.availableCopies,
  };
}

export async function returnLibraryBook(tenantId, issueId, options = {}, returnedByUserId = null, req = null) {
  const issue = await prisma.bookIssue.findFirst({
    where: { id: issueId, tenantId },
    include: { book: true },
  });
  if (!issue) throw new Error('Book issue record not found.');
  if (issue.status === 'RETURNED') {
    const err = new Error('Book has already been returned.');
    err.statusCode = 400;
    throw err;
  }

  const returnDate = new Date();
  let fineAmount = 0.0;

  // Calculate overdue fine if returned past dueDate (₹5 per day overdue)
  const dueDate = new Date(issue.dueDate);
  if (returnDate > dueDate) {
    const diffTime = Math.abs(returnDate - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fineAmount = Number(options.fineOverride !== undefined ? options.fineOverride : diffDays * 5);
  }

  const [updatedIssue, updatedBook] = await prisma.$transaction(async (tx) => {
    const rec = await tx.bookIssue.update({
      where: { id: issueId },
      data: {
        status: 'RETURNED',
        returnDate,
        fineAmount,
      },
      include: {
        book: { select: { id: true, title: true } },
      },
    });

    const b = await tx.libraryBook.update({
      where: { id: issue.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    return [rec, b];
  });

  await logAudit({
    tenantId,
    userId: returnedByUserId,
    action: 'RETURN_BOOK',
    entityType: 'BOOK_ISSUE',
    entityId: issueId,
    newValues: { bookTitle: issue.book.title, fineAmount, returnDate },
    req,
  });

  return {
    issueRecord: updatedIssue,
    fineAmount,
    availableCopiesNow: updatedBook.availableCopies,
  };
}

// ==========================================
// INVENTORY & ASSETS MANAGEMENT
// ==========================================

export async function addInventoryItem(tenantId, data, userId = null, req = null) {
  const item = await prisma.inventoryItem.create({
    data: {
      tenantId,
      campusId: data.campusId || null,
      itemName: data.itemName,
      category: data.category || 'General',
      quantity: Number(data.quantity || 0),
      unit: data.unit || 'units',
      unitPrice: data.unitPrice || 0.0,
      location: data.location || null,
    },
    include: {
      campus: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'ADD_INVENTORY_ITEM',
    entityType: 'INVENTORY_ITEM',
    entityId: item.id,
    newValues: { itemName: item.itemName, quantity: item.quantity, unitPrice: item.unitPrice },
    req,
  });

  return item;
}

export async function listInventoryItems(tenantId) {
  return prisma.inventoryItem.findMany({
    where: { tenantId },
    include: {
      campus: { select: { id: true, name: true } },
    },
    orderBy: { itemName: 'asc' },
  });
}

export async function adjustInventoryStock(tenantId, itemId, data, userId = null, req = null) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, tenantId },
  });
  if (!item) throw new Error('Inventory item not found.');

  const delta = Number(data.quantityDelta);
  const newQuantity = item.quantity + delta;
  if (newQuantity < 0) {
    const err = new Error(`Insufficient inventory stock. Current: ${item.quantity}, Requested reduction: ${Math.abs(delta)}.`);
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { quantity: newQuantity },
  });

  await logAudit({
    tenantId,
    userId,
    action: 'ADJUST_INVENTORY_STOCK',
    entityType: 'INVENTORY_ITEM',
    entityId: itemId,
    newValues: { itemName: item.itemName, previousQty: item.quantity, newQty: newQuantity, reason: data.reason },
    req,
  });

  return {
    item: updated,
    previousQuantity: item.quantity,
    currentQuantity: newQuantity,
  };
}
