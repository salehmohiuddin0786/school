import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/db/prisma.js';

describe('Health and System Endpoints', () => {
  let app;

  before(async () => {
    await connectDatabase();
    app = createApp();
  });

  after(async () => {
    await disconnectDatabase();
  });

  test('GET /api/v1/health returns 200 and healthy database status', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'ok');
    assert.strictEqual(res.body.data.database.status, 'connected');
    assert.ok(typeof res.body.data.database.latencyMs === 'number');
  });

  test('GET /api/v1/health/ready returns 200 readiness status', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.ready, true);
  });
});
