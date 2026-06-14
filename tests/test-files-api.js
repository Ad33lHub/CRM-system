import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  console.log('=== Starting Phase 12 Files & Media API Tests ===');

  // 1. Login
  console.log('\n1. Logging in as Super Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@crm.com',
      password: 'Admin@12345',
    }),
  });

  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginData)}`);
  const accessToken = loginData.data.accessToken;
  const authHeaders = {
    'Authorization': `Bearer ${accessToken}`
  };
  console.log('✅ Logged in successfully.');

  // Create temporary mock files to upload
  const pdfBuffer = Buffer.from('%PDF-1.4MockPDFContentForTestingPhase12Uploads');
  
  // Spoofed file: executable contents renamed to jpeg
  const spoofedBuffer = Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // MZ executable header
    Buffer.from('Some malicious payload')
  ]);

  // Actual executable buffer
  const exeBuffer = Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00]),
    Buffer.from('Executable data')
  ]);

  // SVG file content
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>');

  // Create mock project to upload files to
  console.log('\n2. Fetching existing projects to get a valid entityId...');
  const projectsRes = await fetch(`${BASE_URL}/projects`, { headers: authHeaders });
  const projectsData = await projectsRes.json();
  assert.strictEqual(projectsRes.status, 200);
  assert.ok(projectsData.data.length > 0, 'Must have at least one project in dev database');
  const project = projectsData.data[0];
  const projectId = project._id || project.id;
  console.log(`✅ Using project ID: ${projectId}`);

  // Test 6: Valid File Upload
  console.log('\n3. [TEST 6] Uploading valid PDF file...');
  const formData = new FormData();
  formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'test-document.pdf');
  formData.append('entityType', 'project');
  formData.append('entityId', projectId);

  const uploadRes = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData
  });

  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 201, `Upload failed: ${JSON.stringify(uploadData)}`);
  assert.ok(uploadData.url, 'Should return secure URL');
  assert.ok(uploadData.publicId, 'Should return publicId');
  assert.strictEqual(uploadData.mimeType, 'application/pdf');
  console.log('✅ [TEST 6] Valid file upload passed.');

  // Test 7: MIME spoofing detection
  console.log('\n4. [TEST 7] Uploading renamed .exe to .jpg...');
  const spoofedFormData = new FormData();
  spoofedFormData.append('file', new Blob([spoofedBuffer], { type: 'image/jpeg' }), 'cute-cat.jpg');
  spoofedFormData.append('entityType', 'project');
  spoofedFormData.append('entityId', projectId);

  const spoofedRes = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: spoofedFormData
  });

  const spoofedData = await spoofedRes.json();
  assert.strictEqual(spoofedRes.status, 400, `Renamed file should be rejected: ${JSON.stringify(spoofedData)}`);
  assert.ok(
    spoofedData.message.toLowerCase().includes('file type') && 
    spoofedData.message.toLowerCase().includes('not allowed'), 
    `Expected file type error, got: ${spoofedData.message}`
  );
  console.log('✅ [TEST 7] MIME spoofing detection passed (rejected correctly).');

  // Test 9: Security Scan Rejects Executables
  console.log('\n5. [TEST 9] Uploading executable file...');
  const exeFormData = new FormData();
  exeFormData.append('file', new Blob([exeBuffer], { type: 'application/x-msdownload' }), 'test.exe');
  exeFormData.append('entityType', 'project');
  exeFormData.append('entityId', projectId);

  const exeRes = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: exeFormData
  });

  const exeData = await exeRes.json();
  assert.strictEqual(exeRes.status, 400, `Executable should be rejected: ${JSON.stringify(exeData)}`);
  assert.strictEqual(exeData.message, 'File failed security scan');
  console.log('✅ [TEST 9] Executable rejection passed.');

  // Test 10: Unauthenticated upload rejection
  console.log('\n6. [TEST 10] Uploading without auth token...');
  const unauthRes = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  assert.strictEqual(unauthRes.status, 401);
  console.log('✅ [TEST 10] Unauthenticated upload blocked.');

  // Clean up any existing document with the same name to ensure clean versioning test
  console.log('\n[PRE-CLEANUP] Checking for existing CRM NDA Agreement documents...');
  const getDocsRes = await fetch(`${BASE_URL}/documents?entityType=project&entityId=${projectId}`, {
    headers: authHeaders
  });
  const getDocsData = await getDocsRes.json();
  if (Array.isArray(getDocsData)) {
    for (const doc of getDocsData) {
      if (doc.name === 'CRM NDA Agreement') {
        const idToDelete = doc.id || doc._id;
        console.log(`[PRE-CLEANUP] Deleting existing document with ID: ${idToDelete}`);
        await fetch(`${BASE_URL}/documents/${idToDelete}`, {
          method: 'DELETE',
          headers: authHeaders
        });
      }
    }
  }

  // Test 13: Upload document creates version 1
  console.log('\n7. [TEST 13] Creating a new document...');
  const docFormData = new FormData();
  docFormData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), 'contract-v1.pdf');
  docFormData.append('name', 'CRM NDA Agreement');
  docFormData.append('entityType', 'project');
  docFormData.append('entityId', projectId);
  docFormData.append('category', 'nda');
  docFormData.append('description', 'Non-disclosure agreement for CRM development');
  docFormData.append('changeNote', 'Initial upload');

  const docRes = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: authHeaders,
    body: docFormData
  });

  const docData = await docRes.json();
  assert.strictEqual(docRes.status, 201, `Document creation failed: ${JSON.stringify(docData)}`);
  assert.strictEqual(docData.currentVersion, 1);
  assert.strictEqual(docData.versions.length, 1);
  assert.strictEqual(docData.versions[0].versionNumber, 1);
  assert.ok(docData.versions[0].isActive);
  const docId = docData.id || docData._id;
  console.log(`✅ [TEST 13] Document version 1 created successfully. ID: ${docId}`);

  // Test 14: Re-uploading document with same name creates version 2
  console.log('\n8. [TEST 14] Uploading new version of same document...');
  const docFormData2 = new FormData();
  docFormData2.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), 'contract-v2.pdf');
  docFormData2.append('name', 'CRM NDA Agreement'); // Same name
  docFormData2.append('entityType', 'project');
  docFormData2.append('entityId', projectId);
  docFormData2.append('category', 'nda');
  docFormData2.append('changeNote', 'Second revision');

  const docRes2 = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: authHeaders,
    body: docFormData2
  });

  const docData2 = await docRes2.json();
  assert.strictEqual(docRes2.status, 201, `Document update failed: ${JSON.stringify(docData2)}`);
  assert.strictEqual(docData2.currentVersion, 2);
  assert.strictEqual(docData2.versions.length, 2);
  assert.strictEqual(docData2.versions[1].versionNumber, 2);
  assert.ok(docData2.versions[1].isActive);
  assert.ok(!docData2.versions[0].isActive, 'Version 1 should now be inactive');
  console.log('✅ [TEST 14] Version 2 uploaded and pre-save hooks updated active flags.');

  // Test 15: Retrieve version 1 specifically
  console.log('\n9. [TEST 15] Fetching version 1 download URL...');
  const v1Res = await fetch(`${BASE_URL}/documents/${docId}/download?version=1`, {
    headers: authHeaders
  });
  const v1Data = await v1Res.json();
  assert.strictEqual(v1Res.status, 200);
  assert.ok(v1Data.signedUrl.includes('signature') || v1Data.signedUrl.includes('/s--'), 'URL must be a signed URL');
  console.log('✅ [TEST 15] Successfully retrieved signed URL for version 1.');

  // Clean up: delete document
  console.log('\n10. Cleaning up created document...');
  const deleteDocRes = await fetch(`${BASE_URL}/documents/${docId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(deleteDocRes.status, 200);
  console.log('✅ Cleanup complete.');

  console.log('\n=== All Phase 12 Files & Media API Tests Passed Successfully! ===');
}

run().catch((err) => {
  console.error('❌ Tests failed with error:', err);
  process.exit(1);
});
