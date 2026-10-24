import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';

describe('Tenant Isolation & Permission Security Tests', () => {
  let app;
  let superAdminToken;
  let schoolAdminToken;
  let teacherToken;
  let demoTenant;
  let secondTenant;

  before(async () => {
    await connectDatabase();
    app = createApp();

    // 1. Get tokens
    const superLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@schoolnext.internal', password: 'SuperAdmin@SchoolNext2026!' });
    superAdminToken = superLogin.body.data.tokens.accessToken;

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@greenwood.edu', password: 'Admin@Greenwood2026!' });
    schoolAdminToken = adminLogin.body.data.tokens.accessToken;

    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher.sharma@greenwood.edu', password: 'Teacher@Greenwood2026!' });
    teacherToken = teacherLogin.body.data.tokens.accessToken;

    demoTenant = await prisma.tenant.findUnique({ where: { code: 'GWIS' } });

    // 2. Ensure a second tenant exists for cross-tenant isolation testing
    secondTenant = await prisma.tenant.upsert({
      where: { code: 'STXAV' },
      update: {},
      create: {
        code: 'STXAV',
        name: "St. Xavier's High School",
        type: 'SCHOOL',
        status: 'ACTIVE',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
    });
  });

  after(async () => {
    await disconnectDatabase();
  });

  test('Super Admin can access platform tenant list', async () => {
    const res = await request(app)
      .get('/api/v1/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 2);
  });

  test('School Admin CANNOT access platform tenant list (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/tenants')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Platform Super Admin privileges required'));
  });

  test('School Admin can view their own tenant details', async () => {
    const res = await request(app)
      .get(`/api/v1/tenants/${demoTenant.id}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.code, 'GWIS');
  });

  test('Cross-tenant IDOR attempt: School Admin CANNOT view another tenant details (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/tenants/${secondTenant.id}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  test('Cross-tenant header manipulation: Passing foreign x-tenant-id is rejected (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .set('x-tenant-id', secondTenant.id);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Cross-tenant access violation'));
  });

  test('Permission Enforcement: Teacher CANNOT access user management (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${teacherToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Permission denied'));
  });

  test('Permission Enforcement: School Admin CAN access user management (200 OK)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    // Verify that every returned user belongs strictly to Greenwood
    for (const u of res.body.data) {
      assert.strictEqual(u.tenantId, demoTenant.id);
    }
  });
});
