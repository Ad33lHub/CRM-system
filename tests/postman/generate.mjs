/**
 * Generates the Postman collection + environment files for the CRM API.
 *
 * Run from the repo root:  node tests/postman/generate.mjs
 *
 * The collection asserts the INTENDED final behavior of each endpoint. Endpoints
 * that are not yet implemented on the server will currently fail the run — those
 * failures are accurate TODOs, not problems with the collection. As each backend
 * endpoint lands, its request here should already pass unchanged.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const OUT_DIR = path.resolve('tests/postman');
const ENV_DIR = path.join(OUT_DIR, 'envs');
mkdirSync(ENV_DIR, { recursive: true });

const PLACEHOLDER_ID = '000000000000000000000000';

// ── helpers ────────────────────────────────────────────────────────────────
const testEvent = (exec) => ({ listen: 'test', script: { type: 'text/javascript', exec } });
const prereqEvent = (exec) => ({
  listen: 'prerequest',
  script: { type: 'text/javascript', exec },
});

const url = (segs) => ({ raw: `{{base_url}}/${segs.join('/')}`, host: ['{{base_url}}'], path: segs });
const jsonBody = (obj) => ({
  mode: 'raw',
  raw: JSON.stringify(obj, null, 2),
  options: { raw: { language: 'json' } },
});

function request(name, method, segs, { body, tests, prereq, description } = {}) {
  const item = { name, request: { method, header: [], url: url(segs) }, response: [] };
  if (body) item.request.body = jsonBody(body);
  if (description) item.request.description = description;
  const events = [];
  if (prereq) events.push(prereqEvent(prereq));
  if (tests) events.push(testEvent(tests));
  if (events.length) item.event = events;
  return item;
}

// ── reusable test snippets ───────────────────────────────────────────────────
const status = (code) => `pm.test('Status ${code}', () => pm.response.to.have.status(${code}));`;
const successTrue = "pm.test('Envelope success=true', () => pm.expect(pm.response.json().success).to.be.true);";
const successFalse = "pm.test('Envelope success=false', () => pm.expect(pm.response.json().success).to.be.false);";
const dataArray = "pm.test('data is an array', () => pm.expect(pm.response.json().data).to.be.an('array'));";
const dataHasId = "pm.test('data has _id', () => pm.expect(pm.response.json().data).to.have.property('_id'));";

// ── folders ──────────────────────────────────────────────────────────────────
const folders = [];

// Health & Status
folders.push({
  name: 'Health & Status',
  item: [
    request('Health Check', 'GET', ['health'], {
      tests: [
        status(200),
        "pm.test('data.status is ok', () => pm.expect(pm.response.json().data.status).to.eql('ok'));",
        "pm.test('Response time < 500ms', () => pm.expect(pm.response.responseTime).to.be.below(500));",
      ],
    }),
  ],
});

// Authentication
folders.push({
  name: 'Authentication',
  description: 'Auth flow. Endpoints /register /login /refresh /me /logout are not implemented yet — these requests document the intended contract and will pass once auth lands.',
  item: [
    request('Register User', 'POST', ['auth', 'register'], {
      body: {
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@crm.com',
        password: 'Test@12345',
        role: 'developer',
      },
      tests: [status(201), dataHasId],
    }),
    request('Login - Admin (Save Tokens)', 'POST', ['auth', 'login'], {
      body: { email: '{{admin_email}}', password: '{{admin_password}}' },
      tests: [
        status(200),
        "pm.test('Has access token', () => {",
        '  const res = pm.response.json();',
        "  pm.expect(res.data).to.have.property('accessToken');",
        "  pm.environment.set('access_token', res.data.accessToken);",
        "  pm.environment.set('refresh_token', res.data.refreshToken);",
        '});',
      ],
    }),
    request('Login - Wrong Password', 'POST', ['auth', 'login'], {
      body: { email: '{{admin_email}}', password: 'wrongpassword' },
      tests: [status(401), successFalse],
    }),
    request('Refresh Token', 'POST', ['auth', 'refresh'], {
      body: { refreshToken: '{{refresh_token}}' },
      tests: [
        status(200),
        "pm.test('Returns new access token', () => pm.expect(pm.response.json().data).to.have.property('accessToken'));",
      ],
    }),
    request('Get My Profile', 'GET', ['auth', 'me'], {
      tests: [
        status(200),
        "pm.test('Returns user email', () => pm.expect(pm.response.json().data).to.have.property('email'));",
      ],
    }),
    request('Logout', 'POST', ['auth', 'logout'], {
      tests: [
        status(200),
        "if (pm.response.code === 200) {",
        "  pm.environment.unset('access_token');",
        "  pm.environment.unset('refresh_token');",
        '}',
      ],
    }),
  ],
});

// Clients (full CRUD)
folders.push({
  name: 'Clients',
  description: 'Only GET / and GET /:id are wired today (static stubs). Create/Update/Delete are not implemented yet.',
  item: [
    request('Get All Clients', 'GET', ['clients'], { tests: [status(200), successTrue, dataArray] }),
    request('Create Client', 'POST', ['clients'], {
      body: {
        companyName: 'Test Company Ltd',
        industry: 'technology',
        contacts: [{ name: 'John Doe', email: 'john@test.com', isPrimary: true }],
        status: 'active',
        source: 'referral',
      },
      tests: [
        status(201),
        dataHasId,
        "if (pm.response.code === 201) { pm.collectionVariables.set('test_client_id', pm.response.json().data._id); }",
      ],
    }),
    request('Get Client By ID', 'GET', ['clients', '{{test_client_id}}'], {
      tests: [status(200), successTrue],
    }),
    request('Update Client', 'PATCH', ['clients', '{{test_client_id}}'], {
      body: { status: 'inactive' },
      tests: [
        status(200),
        "pm.test('Status updated', () => pm.expect(pm.response.json().data.status).to.eql('inactive'));",
      ],
    }),
    request('Delete Client (Soft)', 'DELETE', ['clients', '{{test_client_id}}'], {
      tests: [status(200)],
    }),
  ],
});

// Generic CRUD module folders
const minimalBody = {
  leads: { title: 'Test Lead', company: 'Acme Corp', stage: 'new' },
  projects: { name: 'Test Project', status: 'active' },
  tasks: { title: 'Test Task', status: 'todo' },
  invoices: { number: 'INV-TEST-001', status: 'draft', amount: 1000 },
  employees: { firstName: 'Test', lastName: 'Employee', email: 'emp@test.com' },
};

for (const mod of ['leads', 'projects', 'tasks', 'invoices', 'employees']) {
  const idVar = `${mod}_id`;
  const Title = mod.charAt(0).toUpperCase() + mod.slice(1);
  folders.push({
    name: Title,
    description: `Only GET / and GET /:id are wired today. POST/PATCH/DELETE are not implemented yet. Adjust the create body to the real schema when the write routes land.`,
    item: [
      request(`Get All ${Title}`, 'GET', [mod], { tests: [status(200), successTrue, dataArray] }),
      request(`Create ${Title.replace(/s$/, '')}`, 'POST', [mod], {
        body: minimalBody[mod],
        tests: [
          status(201),
          dataHasId,
          `if (pm.response.code === 201) { pm.collectionVariables.set('${idVar}', pm.response.json().data._id); }`,
        ],
      }),
      request(`Get ${Title.replace(/s$/, '')} By ID`, 'GET', [mod, `{{${idVar}}}`], {
        tests: [status(200), successTrue],
      }),
      request(`Update ${Title.replace(/s$/, '')}`, 'PATCH', [mod, `{{${idVar}}}`], {
        body: { ...minimalBody[mod] },
        tests: [status(200)],
      }),
      request(`Delete ${Title.replace(/s$/, '')}`, 'DELETE', [mod, `{{${idVar}}}`], {
        tests: [status(200)],
      }),
    ],
  });
}

// Notifications
folders.push({
  name: 'Notifications',
  description: 'GET / requires auth (req.user) which is not wired yet; PUT /:id marks a notification read. Both are DB-backed.',
  item: [
    request('Get All Notifications', 'GET', ['notifications'], {
      tests: [status(200), successTrue, dataArray],
    }),
    request('Mark Notification Read', 'PUT', ['notifications', '{{notification_id}}'], {
      tests: [status(200), successTrue],
    }),
  ],
});

// Analytics
folders.push({
  name: 'Analytics',
  description: 'Dashboard summary counts. DB-backed.',
  item: [
    request('Get Analytics Summary', 'GET', ['analytics', 'summary'], {
      tests: [
        status(200),
        successTrue,
        "pm.test('Has summary counts', () => pm.expect(pm.response.json().data).to.have.property('openLeads'));",
      ],
    }),
  ],
});

// ── collection ───────────────────────────────────────────────────────────────
const collection = {
  info: {
    _postman_id: randomUUID(),
    name: 'Software House CRM API',
    description:
      'API test collection for the Software House CRM. Asserts intended final behavior; unimplemented endpoints will fail until their phase is built. See docs/10_API_Testing_Guide.md.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  event: [
    prereqEvent([
      "const token = pm.environment.get('access_token');",
      'if (token) {',
      "  pm.request.headers.upsert({ key: 'Authorization', value: 'Bearer ' + token });",
      '}',
    ]),
  ],
  variable: [
    { key: 'test_client_id', value: PLACEHOLDER_ID },
    { key: 'leads_id', value: PLACEHOLDER_ID },
    { key: 'projects_id', value: PLACEHOLDER_ID },
    { key: 'tasks_id', value: PLACEHOLDER_ID },
    { key: 'invoices_id', value: PLACEHOLDER_ID },
    { key: 'employees_id', value: PLACEHOLDER_ID },
    { key: 'notification_id', value: PLACEHOLDER_ID },
  ],
  item: folders,
};

writeFileSync(
  path.join(OUT_DIR, 'CRM_API_Collection.json'),
  JSON.stringify(collection, null, 2) + '\n'
);

// ── environments ─────────────────────────────────────────────────────────────
const envValues = (overrides) => {
  const base = {
    base_url: '',
    client_url: '',
    access_token: '',
    refresh_token: '',
    admin_email: '',
    admin_password: '',
    test_email: '',
    test_password: '',
  };
  const merged = { ...base, ...overrides };
  return Object.entries(merged).map(([key, value]) => ({
    key,
    value,
    type: key.includes('password') || key.includes('token') ? 'secret' : 'default',
    enabled: true,
  }));
};

const environments = {
  development: {
    name: 'CRM — Development',
    values: envValues({
      base_url: 'http://localhost:5000/api',
      client_url: 'http://localhost:3000',
      admin_email: 'superadmin@crm.com',
      admin_password: 'Admin@12345',
      test_email: 'dev@crm.com',
      test_password: 'Dev@12345',
    }),
  },
  staging: {
    name: 'CRM — Staging',
    values: envValues({ base_url: 'https://crm-api-staging.onrender.com/api' }),
  },
  production: {
    name: 'CRM — Production',
    values: envValues({ base_url: 'https://crm-api.onrender.com/api' }),
  },
};

for (const [file, env] of Object.entries(environments)) {
  writeFileSync(
    path.join(ENV_DIR, `${file}.json`),
    JSON.stringify(
      {
        id: randomUUID(),
        name: env.name,
        values: env.values,
        _postman_variable_scope: 'environment',
      },
      null,
      2
    ) + '\n'
  );
}

const requestCount = folders.reduce((n, f) => n + f.item.length, 0);
console.log(`Generated collection with ${folders.length} folders and ${requestCount} requests.`);
console.log('Wrote: CRM_API_Collection.json, envs/{development,staging,production}.json');
