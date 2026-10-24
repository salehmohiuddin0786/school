import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase, prisma } from '../src/db/prisma.js';
import { hashToken } from '../src/utils/crypto.js';

describe('Authentication & Session Security Tests', () => {
  let app;

  before(async () => {
    await connectDatabase();
    app = createApp();
  });

  after(async () => {
    await disconnectDatabase();
  });

  test('POST /api/v1/auth/login succeeds with valid Super Admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@schoolnext.internal',
        password: 'SuperAdmin@SchoolNext2026!',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.isSuperAdmin, true);
    assert.ok(res.body.data.tokens.accessToken);
    assert.ok(res.body.data.tokens.refreshToken);

    // Verify cookies set
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    assert.ok(cookies.some((c) => c.includes('accessToken=')));
    assert.ok(cookies.some((c) => c.includes('refreshToken=')));
  });

  test('POST /api/v1/auth/login fails with invalid password (generic error)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@schoolnext.internal',
        password: 'WrongPassword123!',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Invalid email or password.');
  });

  test('POST /api/v1/auth/login fails with non-existent email (generic error to prevent enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'ghost_user@unknown.internal',
        password: 'AnyPassword123!',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Invalid email or password.');
  });

  test('GET /api/v1/auth/me requires authentication', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('GET /api/v1/auth/me returns profile with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'teacher.sharma@greenwood.edu',
        password: 'Teacher@Greenwood2026!',
      });

    const token = loginRes.body.data.tokens.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.user.email, 'teacher.sharma@greenwood.edu');
    assert.ok(meRes.body.data.roles.includes('TEACHER'));
    assert.ok(meRes.body.data.permissions.includes('attendance.mark'));
  });

  test('POST /api/v1/auth/refresh rotates session and revokes old session', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@greenwood.edu',
        password: 'Admin@Greenwood2026!',
      });

    const initialRefreshToken = loginRes.body.data.tokens.refreshToken;
    const initialTokenHash = hashToken(initialRefreshToken);

    // Refresh session
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    assert.strictEqual(refreshRes.status, 200);
    assert.ok(refreshRes.body.data.accessToken);
    assert.ok(refreshRes.body.data.refreshToken);
    assert.notStrictEqual(refreshRes.body.data.refreshToken, initialRefreshToken);

    // Check database that old session was marked revoked
    const oldSession = await prisma.refreshSession.findUnique({
      where: { tokenHash: initialTokenHash },
    });
    assert.ok(oldSession.revokedAt !== null);

    // Reusing the old revoked refresh token MUST be rejected
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    assert.strictEqual(reuseRes.status, 401);
  });

  test('POST /api/v1/auth/logout revokes refresh session', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student.aarav@greenwood.edu',
        password: 'Student@Greenwood2026!',
      });

    const accessToken = loginRes.body.data.tokens.accessToken;
    const refreshToken = loginRes.body.data.tokens.refreshToken;
    const tokenHash = hashToken(refreshToken);

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    assert.strictEqual(logoutRes.status, 200);

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
    });
    assert.ok(session.revokedAt !== null);
  });
});
