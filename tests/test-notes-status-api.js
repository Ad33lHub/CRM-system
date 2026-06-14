import assert from "node:assert";

const BASE_URL = "http://localhost:5000/api";

let pass = 0;
let fail = 0;
const results = [];

function check(task, num, desc, fn) {
  try {
    fn();
    pass += 1;
    results.push(`PASS | T${task} | ${num} | ${desc}`);
  } catch (err) {
    fail += 1;
    results.push(`FAIL | T${task} | ${num} | ${desc} → ${err.message}`);
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  assert.strictEqual(
    res.status,
    200,
    `Login failed for ${email}: ${JSON.stringify(data)}`,
  );
  return data.data.accessToken;
}

const json = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

async function run() {
  console.log("=== Notes & Status API Tests (Tasks 37 & 38) ===\n");

  const adminToken = await login("superadmin@crm.com", "Admin@12345");
  const managerToken = await login("manager@crm.com", "Manager@12345");
  const plainAdminToken = await login("admin@crm.com", "Admin@12345");

  // Fresh client
  const created = await fetch(`${BASE_URL}/clients`, {
    method: "POST",
    headers: json(adminToken),
    body: JSON.stringify({
      companyName: `Notes Test Co ${Date.now()}`,
      industry: "technology",
      source: "referral",
      status: "lead",
      contacts: [
        { name: "Owner One", email: "owner@notes.test", isPrimary: true },
      ],
    }),
  });
  const createdData = await created.json();
  assert.strictEqual(
    created.status,
    201,
    `Client create failed: ${JSON.stringify(createdData)}`,
  );
  const clientId = createdData.data._id || createdData.data.id;

  /* ── T37: NOTES ──────────────────────────────────────────────────── */

  // TEST 1 — Create note (author populated)
  const c1 = await fetch(`${BASE_URL}/clients/${clientId}/notes`, {
    method: "POST",
    headers: json(adminToken),
    body: JSON.stringify({
      content: "<p>First note</p>",
      contentText: "First note",
    }),
  });
  const c1d = await c1.json();
  check(37, 1, "Create note (author populated)", () => {
    assert.strictEqual(c1.status, 201, `status ${c1.status}`);
    assert.ok(
      c1d.data.author && c1d.data.author.firstName,
      "author not populated",
    );
  });

  // TEST 2 — contentText auto-stripped from HTML
  const c2 = await fetch(`${BASE_URL}/clients/${clientId}/notes`, {
    method: "POST",
    headers: json(adminToken),
    body: JSON.stringify({
      content: "<p>Hello <strong>World</strong> &amp; more</p>",
    }),
  });
  const c2d = await c2.json();
  check(37, 2, "contentText HTML stripping", () => {
    assert.strictEqual(c2.status, 201);
    assert.ok(
      !/[<>]/.test(c2d.data.contentText),
      `contentText has tags: ${c2d.data.contentText}`,
    );
    assert.ok(c2d.data.contentText.includes("Hello"), "text content lost");
  });

  // TEST 3 — Pinned notes sort first
  const c3 = await fetch(`${BASE_URL}/clients/${clientId}/notes`, {
    method: "POST",
    headers: json(adminToken),
    body: JSON.stringify({ content: "<p>Middle note to pin</p>" }),
  });
  const c3d = await c3.json();
  const pinTargetId = c3d.data._id || c3d.data.id;
  await fetch(`${BASE_URL}/clients/${clientId}/notes/${pinTargetId}/pin`, {
    method: "PATCH",
    headers: json(adminToken),
  });
  const listRes = await fetch(`${BASE_URL}/clients/${clientId}/notes`, {
    headers: json(adminToken),
  });
  const listData = await listRes.json();
  check(37, 3, "Pinned notes sort first", () => {
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(
      listData.data[0]._id || listData.data[0].id,
      pinTargetId,
      "pinned not first",
    );
    assert.strictEqual(listData.data[0].isPinned, true);
  });

  // TEST 4 — Pin toggle (unpin)
  const unpin = await fetch(
    `${BASE_URL}/clients/${clientId}/notes/${pinTargetId}/pin`,
    {
      method: "PATCH",
      headers: json(adminToken),
    },
  );
  const unpinData = await unpin.json();
  check(37, 4, "Pin toggle", () => {
    assert.strictEqual(unpin.status, 200);
    assert.strictEqual(unpinData.data.isPinned, false, "should be unpinned");
    assert.strictEqual(unpinData.data.pinnedAt, null);
  });

  // TEST 5 — Pin max 5
  const pinIds = [];
  for (let i = 0; i < 6; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const n = await fetch(`${BASE_URL}/clients/${clientId}/notes`, {
      method: "POST",
      headers: json(adminToken),
      body: JSON.stringify({ content: `<p>Pin candidate ${i}</p>` }),
    });
    // eslint-disable-next-line no-await-in-loop
    const nd = await n.json();
    pinIds.push(nd.data._id || nd.data.id);
  }
  let sixthStatus = 0;
  for (let i = 0; i < 6; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const p = await fetch(
      `${BASE_URL}/clients/${clientId}/notes/${pinIds[i]}/pin`,
      {
        method: "PATCH",
        headers: json(adminToken),
      },
    );
    if (i === 5) sixthStatus = p.status;
  }
  check(37, 5, "Pin max 5 limit", () => {
    assert.strictEqual(
      sixthStatus,
      400,
      `6th pin returned ${sixthStatus}, expected 400`,
    );
  });

  // TEST 6 — Edit ownership (owner=admin)
  const ownNote = await fetch(`${BASE_URL}/clients/${clientId}/notes`, {
    method: "POST",
    headers: json(adminToken),
    body: JSON.stringify({ content: "<p>Owned by super admin</p>" }),
  });
  const ownNoteJson = await ownNote.json();
  const ownNoteId = ownNoteJson.data._id || ownNoteJson.data.id;
  const editOwn = await fetch(
    `${BASE_URL}/clients/${clientId}/notes/${ownNoteId}`,
    {
      method: "PATCH",
      headers: json(adminToken),
      body: JSON.stringify({ content: "<p>Edited by owner</p>" }),
    },
  );
  const editOther = await fetch(
    `${BASE_URL}/clients/${clientId}/notes/${ownNoteId}`,
    {
      method: "PATCH",
      headers: json(managerToken),
      body: JSON.stringify({ content: "<p>Edited by manager</p>" }),
    },
  );
  const editAdmin = await fetch(
    `${BASE_URL}/clients/${clientId}/notes/${ownNoteId}`,
    {
      method: "PATCH",
      headers: json(plainAdminToken),
      body: JSON.stringify({ content: "<p>Edited by admin</p>" }),
    },
  );
  check(37, 6, "Edit own note / ownership check", () => {
    assert.strictEqual(editOwn.status, 200, `owner edit ${editOwn.status}`);
    assert.strictEqual(
      editOther.status,
      403,
      `non-owner manager edit ${editOther.status}, expected 403`,
    );
    assert.strictEqual(editAdmin.status, 200, `admin edit ${editAdmin.status}`);
  });

  // TEST 7 — Soft delete
  const delRes = await fetch(
    `${BASE_URL}/clients/${clientId}/notes/${ownNoteId}`,
    {
      method: "DELETE",
      headers: json(adminToken),
    },
  );
  const afterDel = await fetch(
    `${BASE_URL}/clients/${clientId}/notes?limit=100`,
    { headers: json(adminToken) },
  );
  const afterDelData = await afterDel.json();
  check(37, 7, "Soft delete note", () => {
    assert.strictEqual(delRes.status, 200);
    const stillThere = afterDelData.data.some(
      (n) => (n._id || n.id) === ownNoteId,
    );
    assert.ok(!stillThere, "deleted note still returned");
  });

  /* ── T38: STATUS ─────────────────────────────────────────────────── */

  // TEST 8 — Valid transition lead → active (+ status log)
  const t8 = await fetch(`${BASE_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: json(adminToken),
    body: JSON.stringify({
      status: "active",
      statusChangeReason: "Signed contract",
    }),
  });
  const t8d = await t8.json();
  check(38, 8, "Valid status transition", () => {
    assert.strictEqual(
      t8.status,
      200,
      `status ${t8.status}: ${JSON.stringify(t8d)}`,
    );
    assert.strictEqual(t8d.data.status, "active");
  });

  // TEST 9 — Invalid transition active → lead
  const t9 = await fetch(`${BASE_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: json(adminToken),
    body: JSON.stringify({
      status: "lead",
      statusChangeReason: "Trying invalid",
    }),
  });
  check(38, 9, "Invalid transition blocked", () => {
    assert.strictEqual(t9.status, 400, `expected 400, got ${t9.status}`);
  });

  // TEST 10 — Status change without reason
  const t10 = await fetch(`${BASE_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: json(adminToken),
    body: JSON.stringify({ status: "inactive" }),
  });
  const t10d = await t10.json();
  check(38, 10, "Status change requires reason", () => {
    assert.strictEqual(t10.status, 400, `expected 400, got ${t10.status}`);
    assert.ok(/reason/i.test(t10d.message), `message: ${t10d.message}`);
  });

  // TEST 11 — Churn (active → churned) returns 200 + logs
  const t11 = await fetch(`${BASE_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: json(adminToken),
    body: JSON.stringify({
      status: "churned",
      statusChangeReason: "Client cancellation",
      churnReason: "Budget cut",
    }),
  });
  const t11d = await t11.json();
  check(38, 11, "Churn transition (admins notified)", () => {
    assert.strictEqual(
      t11.status,
      200,
      `status ${t11.status}: ${JSON.stringify(t11d)}`,
    );
    assert.strictEqual(t11d.data.status, "churned");
  });

  // TEST 12 — Get status log
  const logRes = await fetch(`${BASE_URL}/clients/${clientId}/status-log`, {
    headers: json(adminToken),
  });
  const logData = await logRes.json();
  check(38, 12, "Status log returns history", () => {
    assert.strictEqual(logRes.status, 200);
    assert.ok(Array.isArray(logData.data), "not an array");
    assert.ok(
      logData.data.length >= 2,
      `expected >=2 entries, got ${logData.data.length}`,
    );
    assert.ok(
      logData.data[0].changedBy && logData.data[0].changedBy.firstName,
      "changedBy not populated",
    );
    // Most recent first
    const t0 = new Date(logData.data[0].createdAt).getTime();
    const t1 = new Date(logData.data[1].createdAt).getTime();
    assert.ok(t0 >= t1, "not sorted most-recent-first");
  });

  // Cleanup
  await fetch(`${BASE_URL}/clients/${clientId}`, {
    method: "DELETE",
    headers: json(adminToken),
    body: JSON.stringify({ reason: "Automated test cleanup" }),
  });

  console.log(results.join("\n"));
  console.log(`\nTotal: ${pass}/${pass + fail} passed`);
  if (fail > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
