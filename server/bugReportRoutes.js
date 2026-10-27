import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function getReportsDir() {
  return path.resolve(
    process.env.POF_BUG_REPORTS_DIR ||
      path.join(__dirname, '../data/bug-reports'),
  );
}

function ensureReportsDir() {
  fs.mkdirSync(getReportsDir(), { recursive: true });
}

function sanitizeText(value, max = 8000) {
  return String(value || '').slice(0, max);
}

function writeReportFile(payload) {
  ensureReportsDir();
  const id = `br_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const filePath = path.join(getReportsDir(), `${id}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return { id, filePath };
}

function maybeEmailReport(payload) {
  const to = String(process.env.BUG_REPORT_EMAIL_TO || '').trim();
  if (!to) return { emailed: false };
  // Optional SMTP via env — log intent when not configured with transport.
  const from = process.env.BUG_REPORT_EMAIL_FROM || 'bugs@pantsonfire.app';
  console.log(
    `[bug-report] email fallback stub to=${to} from=${from} id=${payload.id} desc=${sanitizeText(payload.description, 120)}`,
  );
  return { emailed: false, stub: true };
}

export function mountBugReportRoutes(app) {
  app.post('/api/bug-reports', (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const description = sanitizeText(body.description, 4000);
      if (!description) {
        res.status(400).json({ error: 'description required' });
        return;
      }
      const screenshotDataUrl = sanitizeText(body.screenshotDataUrl, 2_000_000);
      const record = {
        id: null,
        description,
        screenshotDataUrl: screenshotDataUrl || null,
        context: body.context || {},
        diagnostics: body.diagnostics || {},
        submittedAt: body.submittedAt || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        clientIp: req.ip,
      };
      const { id } = writeReportFile(record);
      record.id = id;
      const emailMeta = maybeEmailReport(record);
      res.status(201).json({ ok: true, id, email: emailMeta });
    } catch (err) {
      console.error('[bug-report] failed', err);
      res.status(500).json({ error: 'failed to store report' });
    }
  });

  app.get('/api/bug-reports/health', (_req, res) => {
    res.json({ ok: true });
  });
}
