import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mountBugReportRoutes } from '../../server/bugReportRoutes.js';

function createAppStub() {
  const handlers = new Map();
  return {
    post: (route, handler) => handlers.set(`POST ${route}`, handler),
    get: (route, handler) => handlers.set(`GET ${route}`, handler),
    handlers,
  };
}

function createResStub() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('bug report POST requires description', async () => {
  const app = createAppStub();
  mountBugReportRoutes(app);
  const handler = app.handlers.get('POST /api/bug-reports');
  const res = createResStub();
  const req = { body: {}, ip: '127.0.0.1' };
  await handler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'description required');
});

test('bug report POST stores report and returns id', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pof-bug-'));
  const prev = process.env.POF_BUG_REPORTS_DIR;
  process.env.POF_BUG_REPORTS_DIR = tmp;
  const app = createAppStub();
  mountBugReportRoutes(app);
  const handler = app.handlers.get('POST /api/bug-reports');
  const res = createResStub();
  const req = {
    body: {
      description: 'Category icons missing on device',
      context: { screen: 'category-choice' },
      diagnostics: { appVersion: '0.1.0' },
    },
    ip: '10.0.0.1',
  };
  await handler(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ok, true);
  assert.match(res.body.id, /^br_/);
  const files = fs.readdirSync(tmp);
  assert.equal(files.length, 1);
  const stored = JSON.parse(fs.readFileSync(path.join(tmp, files[0]), 'utf8'));
  assert.equal(stored.description, 'Category icons missing on device');
  process.env.POF_BUG_REPORTS_DIR = prev;
  fs.rmSync(tmp, { recursive: true, force: true });
});
