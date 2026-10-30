import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';

describe('Phase 14 — Operations Engine (Transport, Library & Inventory)', () => {
  let app;
  let adminToken;
  let studentToken;
  let demoTenant;
  let testStudent;
  let createdRouteId;
  let createdVehicleId;
  let createdBookId;
  let createdIssueId;
  let createdItemId;

  before(async () => {
    await connectDatabase();
    app = createApp();

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });

    // 1. Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@greenwood.edu', password: 'Admin@Greenwood2026!' });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Authenticate Student
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.aarav@greenwood.edu', password: 'Student@Greenwood2026!' });
    studentToken = studentLogin.body.data.tokens.accessToken;

    testStudent = await prisma.student.findFirst({
      where: { tenantId: demoTenant.id, admissionNumber: 'ADM-2025-001' },
      include: { user: true },
    });
  });

  after(async () => {
    try {
      if (createdIssueId) {
        await prisma.bookIssue.deleteMany({ where: { id: createdIssueId } });
      }
      if (createdBookId) {
        await prisma.libraryBook.deleteMany({ where: { id: createdBookId } });
      }
      if (createdVehicleId) {
        await prisma.vehicle.deleteMany({ where: { id: createdVehicleId } });
      }
      if (createdRouteId) {
        await prisma.transportRoute.deleteMany({ where: { id: createdRouteId } });
      }
      if (createdItemId) {
        await prisma.inventoryItem.deleteMany({ where: { id: createdItemId } });
      }
    } catch (e) {
      // ignore
    }
    await disconnectDatabase();
  });

  // ==========================================
  // SECTION 1: TRANSPORT MANAGEMENT
  // ==========================================
  describe('Transport Routes & Vehicle Fleet', () => {
    test('Admin creates a school bus transport route', async () => {
      const res = await request(app)
        .post('/api/v1/operations/transport/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          routeName: `Greenwood North Corridor ${Date.now().toString().slice(-4)}`,
          startPoint: 'City Center Hub',
          endPoint: 'Campus Gate 1',
          stops: [
            { stopName: 'Civil Lines', pickupTime: '07:15 AM' },
            { stopName: 'Metro Station', pickupTime: '07:30 AM' },
          ],
          fare: 2500.0,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.id);
      createdRouteId = res.body.data.id;
    });

    test('Admin registers a bus in the fleet with assigned route', async () => {
      const regNumber = `DL-01-GW-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/v1/operations/transport/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          routeId: createdRouteId,
          registrationNumber: regNumber,
          model: 'Tata Marcopolo 42-Seater',
          capacity: 42,
          driverName: 'Suresh Kumar',
          driverPhone: '+919876543299',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.capacity, 42);
      createdVehicleId = res.body.data.id;
    });

    test('Rejects duplicate vehicle registration number in same tenant', async () => {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: createdVehicleId } });

      const res = await request(app)
        .post('/api/v1/operations/transport/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          registrationNumber: vehicle.registrationNumber,
          model: 'Duplicate Bus',
          capacity: 30,
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /already registered/i);
    });

    test('Lists active transport routes with fleet details', async () => {
      const res = await request(app)
        .get('/api/v1/operations/transport/routes')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      const found = res.body.data.some((r) => r.id === createdRouteId);
      assert.strictEqual(found, true);
    });
  });

  // ==========================================
  // SECTION 2: LIBRARY CATALOG & CIRCULATION
  // ==========================================
  describe('Library Book Cataloging & Circulation Lifecycle', () => {
    test('Admin catalogs a new library textbook (3 copies available)', async () => {
      const isbn = `978-${Date.now().toString().slice(-9)}`;
      const res = await request(app)
        .post('/api/v1/operations/library/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isbn,
          title: 'Advanced Computer Networks & Security',
          author: 'Andrew S. Tanenbaum',
          publisher: 'Pearson Education',
          edition: '6th Edition',
          totalCopies: 3,
          rackLocation: 'Rack B-12',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.availableCopies, 3);
      createdBookId = res.body.data.id;
    });

    test('Staff issues a copy of the book to Student Aarav', async () => {
      assert.ok(testStudent, 'Test student must exist');

      const res = await request(app)
        .post('/api/v1/operations/library/issue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId: createdBookId,
          userId: testStudent.userId,
          daysAllowed: 14,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.availableCopiesRemaining, 2);
      assert.strictEqual(res.body.data.issueRecord.status, 'ISSUED');
      createdIssueId = res.body.data.issueRecord.id;
    });

    test('Staff returns the book copy and restores available stock', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/library/return/${createdIssueId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.availableCopiesNow, 3);
      assert.strictEqual(res.body.data.issueRecord.status, 'RETURNED');
      assert.ok(res.body.data.issueRecord.returnDate);
    });

    test('Rejects duplicate return of an already returned book issue', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/library/return/${createdIssueId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /already been returned/i);
    });
  });

  // ==========================================
  // SECTION 3: INVENTORY & ASSETS
  // ==========================================
  describe('Inventory Stock Management & Depletion Control', () => {
    test('Admin adds a new inventory stock item (50 units)', async () => {
      const res = await request(app)
        .post('/api/v1/operations/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemName: `Arduino Robotics STEM Kit ${Date.now().toString().slice(-4)}`,
          category: 'Science & Robotics Lab',
          quantity: 50,
          unit: 'kits',
          unitPrice: 1850.0,
          location: 'Lab Store Room 2',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.quantity, 50);
      createdItemId = res.body.data.id;
    });

    test('Admin consumes 10 units for classroom workshop', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/inventory/${createdItemId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantityDelta: -10,
          reason: 'Issued 10 kits for Grade 10 Robotics Workshop',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.previousQuantity, 50);
      assert.strictEqual(res.body.data.currentQuantity, 40);
    });

    test('Rejects depletion request exceeding available inventory stock', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/inventory/${createdItemId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantityDelta: -100, // Current is 40!
          reason: 'Excess request',
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /Insufficient inventory stock/i);
    });
  });

  // ==========================================
  // SECTION 4: RBAC AUTHORIZATION
  // ==========================================
  describe('Role-Based Access Control on Operations', () => {
    test('Student CANNOT catalog books or add inventory items (403 Forbidden)', async () => {
      const bookRes = await request(app)
        .post('/api/v1/operations/library/books')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Hacker Manual',
          author: 'Unknown',
        });
      assert.strictEqual(bookRes.status, 403);

      const invRes = await request(app)
        .post('/api/v1/operations/inventory')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          itemName: 'Unauthorized Item',
          quantity: 10,
        });
      assert.strictEqual(invRes.status, 403);
    });
  });
});
