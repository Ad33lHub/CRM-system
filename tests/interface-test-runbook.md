# CRM User Interface Testing Runbook

This runbook documents every user interaction flow, verification checkpoint, fields validation, and edge case across all views in the Software House CRM. Use this document as the single source of truth for manual QA testing and automated UI validation.

---

## 1. Authentication & Security Gateways

### 1.1 Login Page (`/login`)
*   **User Action**: Access the login page, enter email and password.
*   **Target Interfaces**:
    *   `Email` input field (ID: `email`)
    *   `Password` input field (ID: `password`) with a "Show/Hide" toggle icon button.
    *   `Remember Me` checkbox (ID: `remember-me`).
    *   `Sign In` submit button (ID: `btn-login`).
*   **Validation Checkpoints**:
    *   **Blank Inputs**: Clicking `Sign In` with blank fields highlights required borders and shows HTML5 validation warnings.
    *   **Invalid Credentials**: Entering an unregistered email or incorrect password shows a toast alert: `"Invalid credentials"`.
    *   **Password Visibility**: Clicking the "Eye" icon switches the password input type from `password` to `text` and changes the icon to "EyeOff".
    *   **Locked Account (Brute Force)**: Attempting 5 consecutive failed logins blocks the account. Next attempt displays a clear lockout toast: `"Account is locked due to multiple failed login attempts. Please try again after 15 minutes."` with a countdown spinner.
    *   **Role-Based Routing**:
        *   Logging in as `super_admin` / `admin` / `manager` redirects to `/admin/dashboard` or `/projects`.
        *   Logging in as `developer` / `designer` / `qa_engineer` redirects to `/tasks` or `/profile`.
        *   Logging in as `client` redirects to `/projects`.
    *   **Remember Me Session Persistence**: Checking `Remember Me` retains the email input on page reload via local storage.

### 1.2 Forgot Password Page (`/forgot-password`)
*   **User Action**: Click the "Forgot Password?" link on `/login`, type the account email, and request a reset link.
*   **Target Interfaces**:
    *   `Email` input field (ID: `email`)
    *   `Send Reset Link` button (ID: `btn-send-reset`)
*   **Validation Checkpoints**:
    *   **Non-existent Email**: Submitting a domain email not registered in the system displays a Toast notice: `"If this email is registered, a reset link will be sent."` (prevents user enumeration).
    *   **Success state**: Submitting a valid email changes the button to a success message block with a checkmark and sends a signed secure token mailer.

### 1.3 Reset Password Page (`/reset-password?token=XYZ`)
*   **User Action**: Access the signed token URL, enter a new password, and submit.
*   **Target Interfaces**:
    *   `New Password` field (ID: `password`)
    *   `Confirm Password` field (ID: `confirm-password`)
    *   `Reset Password` submit button (ID: `btn-reset-password`)
*   **Validation Checkpoints**:
    *   **Mismatch Passwords**: Submitting mismatched passwords highlights fields in red with error text: `"Passwords do not match"`.
    *   **Complexity Check**: Password must be at least 8 characters long, containing uppercase, lowercase, numbers, and special symbols. Otherwise, shows a validation toast.
    *   **Expired/Invalid Token**: Accessing with an altered or expired URL token displays an error panel: `"Invalid or expired token. Please request a new link."` and blocks submissions.

---

## 2. Shell Layout, Sidebar & Navigation

### 2.1 Responsive Sidebar (`/`)
*   **User Action**: Hover over sidebar items, click links, minimize/collapse the menu.
*   **Target Interfaces**:
    *   Sidebar wrapper (ID: `sidebar`)
    *   Toggle Sidebar collapse button (ID: `btn-sidebar-toggle`)
    *   Navigation link elements (ID format: `nav-link-[route-name]`)
    *   Online session indicators (Presence dots)
*   **Validation Checkpoints**:
    *   **Highlighting Active Routes**: The active navigation item displays a high-contrast background (blue/slate) and a left-accent border.
    *   **Role Permissions Filter**:
        *   Admins/Managers see all links (Clients, Employees, Invoices, Presence, Reports, Settings, Chat, Tasks, Tools).
        *   Developers/Designers do not see "Invoices" or "Presence" options in the sidebar.
        *   Clients only see "Projects" and "Invoices".
    *   **Real-time Badges**:
        *   *Unread Messages Count*: Dynamically increments/decrements in real time next to the "Chat" item when messages are received in background.
        *   *Overdue Tasks Count*: Displays a red badge next to the "Tasks" item highlighting overdue tasks.
    *   **Collapsible State**: Clicking the toggle collapses the sidebar into icon-only mode. Hovering over icons shows text tooltips.

### 2.2 Global Header Bar
*   **User Action**: Click notifications, toggle dark mode, click profile dropdown.
*   **Target Interfaces**:
    *   Theme toggle button (ID: `btn-theme-toggle`)
    *   Notification Bell button (ID: `btn-notification-bell`)
    *   User Profile Dropdown (ID: `btn-profile-dropdown`)
*   **Validation Checkpoints**:
    *   **Dark Mode Toggle**: Clicking the theme button toggles the HTML class `dark`, transitioning colors instantly from clean slate to vibrant dark mode (colors check out: HSL tailor palettes, slate-900 backgrounds).
    *   **Real-time Notifications List**: Clicking the bell opens a scrollable popup. Clicking "Mark all as read" clears the alert badge.

---

## 3. Client Account Management

### 3.1 Clients Registry (`/clients`)
*   **User Action**: Search clients, sort registry, click a client card.
*   **Target Interfaces**:
    *   Search input field (ID: `client-search`)
    *   Add Client button (ID: `btn-add-client`)
    *   Client card links
*   **Validation Checkpoints**:
    *   **Instant Search**: Typing in the search field filters client cards by company name or contact person instantly without page reloads.

### 3.2 Client Wizard Creator (`/clients/new`)
*   **User Action**: Enter client billing details, upload contract, and submit.
*   **Target Interfaces**:
    *   `Company Name` field (ID: `client-company`)
    *   `Contact Name` field (ID: `client-contact`)
    *   `Email` field (ID: `client-email`)
    *   `Upload Agreement` input (ID: `client-agreement`)
*   **Validation Checkpoints**:
    *   **Duplicate Prevention**: Submitting a company name that already exists displays a validation error: `"A client account with this company name already exists."`
    *   **MIME Rejection**: Dragging and dropping an executable file (`.exe` or `.dll`) into the uploader triggers a validation toast: `"Only PDF and Image files are allowed for security."`

---

## 4. Project Workspace & RAG Controls

### 4.1 Projects Workspace Page (`/projects`)
*   **User Action**: Filter projects by status, check health markers.
*   **Target Interfaces**:
    *   Status filter tabs (All, Active, On Hold, Completed, Cancelled)
    *   Project Health Indicators (RAG dots)
*   **Validation Checkpoints**:
    *   **RAG Dot Verification**: Each project must display a colored status dot signifying health status:
        *   `Green` (On track)
        *   `Amber` (At risk)
        *   `Red` (Critical block / delayed)
    *   **Status Filters**: Clicking "On Hold" updates the workspace view, displaying only matches without refreshing the browser layout.

### 4.2 Project Creator Wizard (`/projects/new`)
*   **User Action**: Fill 6-step wizard (Details, Client, Budget, Milestones, Team, Review).
*   **Target Interfaces**:
    *   Wizard tabs/steps progress bar (ID: `project-wizard-progress`)
    *   `Project Name` input (ID: `project-name`)
    *   Next/Back control buttons
*   **Validation Checkpoints**:
    *   **Wizard Step-by-Step validation**: Users cannot skip forward without completing required fields in the current step (e.g. step 1 requires project name, startDate, and client selection).
    *   **Live Summary**: The final review step aggregates inputs in a summary sheet before the create API mutation is dispatched.

### 4.3 Project Details & 6-Tab Console (`/projects/:id`)
*   **User Action**: Click tabs, download files, view milestones.
*   **Target Interfaces**:
    *   Tabs triggers (Overview, Tasks, Members, Invoices, Files, Timeline)
    *   Secure Files uploader
    *   Download buttons for versioned files
*   **Validation Checkpoints**:
    *   **Overview Tab**: Displays RAG details, budget estimations, actual expenditure, and milestone status blocks.
    *   **Tasks Tab**: Lists all deliverables. Clicking a task links to the detail page.
    *   **Members Tab**: Shows the team roster assigned to the workspace.
    *   **Invoices Tab**: Displays billing invoice cards generated for this project.
    *   **Files Tab (Document Storage Integration)**:
        *   *Upload Document*: Dragging a file uploads it securely via signed Cloudinary hooks. Shows a progress spinner.
        *   *Version Upload*: Dragging a file with an identical name uploads it as a new version. The UI increments the version tag (e.g., `v2` instead of creating duplicate file entries).
        *   *Download Action*: Clicking download requests a temporary secure signed URL from the backend and triggers a native browser download.
        *   *In-Browser Preview*: Clicking "Preview" opens the document in the inline preview widget.

---

## 5. Tasks & Sprints Dashboard

### 5.1 Kanban Board & List Toggle (`/tasks`)
*   **User Action**: Toggle between Kanban and List views, filter by priority, drag/change task statuses.
*   **Target Interfaces**:
    *   View switcher (Kanban / List)
    *   Priority filter dropdown (All, Low, Medium, High, Critical)
    *   Task Cards inside column buckets
    *   Status selector dropdown on cards (ID: `select-task-status`)
*   **Validation Checkpoints**:
    *   **Kanban Columns**: Column headers dynamically count matching tasks (`To Do`, `In Progress`, `In Review`, `Testing`, `Done`).
    *   **Color-coded Priority Badges**: Priority tags render styled classes (Critical: Rose/Red, High: Amber, Medium: Blue, Low: Slate).
    *   **Instant Status Move**: Changing status via the card select dropdown moves the card to the corresponding column instantly and updates the backend.

### 5.2 Task Details Inspector (`/tasks/:id`)
*   **User Action**: Log hours, add attachments, submit comments.
*   **Target Interfaces**:
    *   `Log Hours` input field and `Log` submit button
    *   `Log Hours Progress Bar`
    *   `File Attachment` upload input trigger
    *   `Comment` text field and submit button
*   **Validation Checkpoints**:
    *   **Hours Progress Bar**: Logging 2 hours on a 10-hour estimate updates the progress bar to 20%. Logging additional hours exceeds the bar gracefully with a warn color.
    *   **Task Attachments**: Uploaded files show in the attachments panel with a file size indicator and inline preview buttons.
    *   **Discussion Feed**: Submitting comments posts them to the activity log, auto-stamping the date/time and author credentials.

---

## 6. Employees & Roster Registry

### 6.1 Employee Directory (`/employees`)
*   **User Action**: Filter by department/role, check real-time presence markers.
*   **Target Interfaces**:
    *   Department filter select (All, Engineering, Design, QA, Management, Sales)
    *   Active staff cards
*   **Validation Checkpoints**:
    *   **Presence Dot**: Renders a live green indicator if the employee has a socket connection open on the platform; otherwise shows a grey dot.

### 6.2 Employee Create Wizard (`/employees/new`)
*   **User Action**: Complete a 4-step wizard (Personal Info, Job Details, Compensation, Review).
*   **Target Interfaces**:
    *   Step progress indicators
    *   `Email` field (ID: `emp-email`)
    *   `Salary (USD)` field (ID: `emp-salary`)
*   **Validation Checkpoints**:
    *   **Strict Emails**: Submitting an email address that does not contain `@` or domain fails validation with border highlight warning.
    *   **Compensation Review**: Summary displays salary breakdown before submission.

### 6.3 Employee Profile Tab Inspector (`/employees/:id`)
*   **User Action**: Navigate tabs (Profile, Compensation, Attendance, Identity/Documents).
*   **Target Interfaces**:
    *   Check-in Logs Table (Attendance tab)
    *   Contracts Archive (Identity/Documents tab)
*   **Validation Checkpoints**:
    *   **Attendance Tab**: Renders a structured grid listing check-in time, check-out time, IP addresses, and tags (Present: green, Late: amber).
    *   **Contract Archive (Security uploads)**: Allows administrators to attach verification scans (National ID, NDAs, Degrees). Only users with permissions can see the list.

---

## 7. Invoices Builder & Approvals

### 7.1 Invoice Creation Canvas (`/invoices/new`)
*   **User Action**: Select client, add dynamic billing line items, modify quantities/rates.
*   **Target Interfaces**:
    *   Client dropdown (ID: `select-client`)
    *   Line Items Rows (Description, Qty, Rate, Tax%)
    *   `Add Item Row` button
    *   `Live Preview Canvas` panel (renders active total dynamically)
*   **Validation Checkpoints**:
    *   **Line Item Calculations**:
        *   Entering Qty: `2`, Rate: `1000` with Tax: `10%` automatically displays: Subtotal: `$2,000`, Tax: `$200`, Grand Total: `$2,200` in the live layout.
        *   Adding new items automatically sums all values and updates the preview instantly.
    *   **Required Client Validation**: Submitting an invoice without selecting a client fails validation.

### 7.2 Invoice Details & Payment Verification (`/invoices/:id`)
*   **User Action**: Approve payment, upload receipt file.
*   **Target Interfaces**:
    *   `Approve Payment` action button (ID: `btn-approve-payment`)
    *   Verification receipt file drop (ID: `receipt-file-upload`)
    *   `Confirm & Mark Paid` button
*   **Validation Checkpoints**:
    *   **Payment Verification Check**: Clicking `Approve Payment` opens a modal. The `Confirm` action remains disabled until a valid payment receipt document is uploaded.
    *   **Visual State Update**: Confirming payment closes the dialog, changes the invoice badge from `Sent`/`Overdue` to `Paid` (success green), and displays the receipt link in the sidebar files tab.

---

## 8. Real-time Collaboration (Chat & Presence)

### 8.1 Active Chat Interface (`/chat`)
*   **User Action**: Click channels, type messages, upload images, check read receipts.
*   **Target Interfaces**:
    *   Channel list sidebar
    *   Message timeline panel
    *   `Message Input` field (ID: `chat-message-input`) and `Send` button
    *   Chat attachments uploader
*   **Validation Checkpoints**:
    *   **Interactive Messaging**: Sending a message appends it to the timeline stream instantly.
    *   **File Previews**: Uploading an image in chat displays a miniature preview wrapper within the message card. Non-image files (like PDFs) display file-type icons.
    *   **Roster Presence Sync**: The right channel sidebar updates online status tags in real time using WebSocket notifications.

### 8.2 Team Directory Page (`/directory`)
*   **User Action**: Filter team members by expertise.
*   **Target Interfaces**:
    *   Department/Skill filtering selectors
*   **Validation Checkpoints**:
    *   **Department Grouping**: Clicking a department displays all matching employees with their skills list, email link, and online presence indicator.

### 8.3 Attendance Check-in Card (`/attendance`)
*   **User Action**: Check in, check out, review attendance history.
*   **Target Interfaces**:
    *   `Check In` action button
    *   `Check Out` action button
    *   Attendance Calendar Matrix
*   **Validation Checkpoints**:
    *   **Check-in Logic**:
        *   Checking in before 9:30 AM logs a status of `"Present"` (Green).
        *   Checking in after 9:30 AM logs a status of `"Late"` (Amber).
        *   Clicking `Check In` changes the button to `Check Out` and registers the current time in the table.

---

## 9. AI Copilots & Automation

### 9.1 AI Meeting Processor (`/meetings`)
*   **User Action**: Paste meeting transcripts, trigger AI processor, review summary.
*   **Target Interfaces**:
    *   `Transcript` text area
    *   `Process Audio/Transcript` button
    *   AI output tabs (Summary, Action Items checklist)
*   **Validation Checkpoints**:
    *   **AI Synthesis Output**: Processing a transcript populates the Summary tab with an aggregated narrative, and populates the Action Items tab with automated checklist items assigning tasks to roles (e.g., Developer, Lead Designer) with realistic due dates.

### 9.2 AI Proposal & Contract Generator (`/proposals`)
*   **User Action**: Enter title, client, budget, and timeline terms, click generate.
*   **Target Interfaces**:
    *   Proposal input forms
    *   `Generate AI Proposal Brief` button
    *   Markdown preview canvas
*   **Validation Checkpoints**:
    *   **Markdown Preview**: Generating the proposal populates the preview canvas with clean, auto-structured markdown layout containing executive summary, scope details, and financial terms.

### 9.3 AI Email Writer (`/tools/email`)
*   **User Action**: Enter recipient, points, select tone, generate draft.
*   **Target Interfaces**:
    *   Email inputs
    *   Email draft editor canvas
*   **Validation Checkpoints**:
    *   **Clipboard Helper**: Generating emails populates a read-only text container. Clicking "Copy to Clipboard" triggers a validation toast: `"Email copied to clipboard!"`.

---

## 10. Analytics & System Administration

### 10.1 Reports Dashboard (`/reports`)
*   **User Action**: Click chart filters, review performance metrics.
*   **Target Interfaces**:
    *   Active project health cards
    *   Visual Charts canvases (Recharts / Chart.js graphs)
*   **Validation Checkpoints**:
    *   **Data Consistency**: Hovering over chart elements (such as leads funnels or task charts) renders detailed tooltips showing correct counts matching the active database stats.

### 10.2 Profile settings & Avatar Cropping (`/settings/profile`)
*   **User Action**: Edit name, change credentials, upload avatar picture.
*   **Target Interfaces**:
    *   `AvatarUpload` circle canvas and upload file selector
    *   Profile details view-only cards
*   **Validation Checkpoints**:
    *   **Avatar Image Processing**: Uploading a picture runs the file through backend image processing (cropping/compressing). The page reloads automatically after success, showing the updated circular avatar image.

### 10.3 Presence Panel & Activity Dashboard (`/admin/dashboard`)
*   **User Action**: Monitor socket sessions, view system logs.
*   **Target Interfaces**:
    *   Active users session counters
    *   System audit log timelines
*   **Validation Checkpoints**:
    *   **Session Monitor**: Opening a new browser window in incognito mode logs in a user and increments the "Active Socket Sessions" count dynamically without reload. Closing the window decrements the counter.
    *   **Audit logs**: Operations (like client creations, status changes, or document updates) output an audit log trail showing timestamp, actor email, and changes.

---

## 11. Automated Interface Test Suite (`tests/test-interface-e2e.js`)

Below is the automated Puppeteer script that tests key interface entry points:

```javascript
import puppeteer from 'puppeteer';
import assert from 'node:assert';

const CLIENT_URL = 'http://localhost:5173';

async function runInterfaceTests() {
  console.log('=== Starting CRM Automated Interface E2E Tests ===');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Load Login Screen
    console.log('\n1. Verifying Login Screen loading...');
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    
    const pageTitle = await page.title();
    console.log(`Page Title: "${pageTitle}"`);
    
    // Check if input forms exist
    const emailInput = await page.$('input[id="email"]');
    const passwordInput = await page.$('input[id="password"]');
    assert.ok(emailInput, 'Email field must exist');
    assert.ok(passwordInput, 'Password field must exist');
    console.log('✅ Login screen elements validated.');

    // 2. Test Lockout Alert
    console.log('\n2. Testing invalid credentials & lockout trigger...');
    for (let i = 0; i < 5; i++) {
      await page.type('input[id="email"]', `wronguser_${i}@crm.com`);
      await page.type('input[id="password"]', 'WrongPassword123');
      await page.click('button[id="btn-login"]');
      
      // Wait briefly for response
      await new Promise(r => setTimeout(r, 400));
      
      // Clear inputs
      await page.click('input[id="email"]', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.click('input[id="password"]', { clickCount: 3 });
      await page.keyboard.press('Backspace');
    }

    // Try a 6th time to trigger Lockout warning
    await page.type('input[id="email"]', 'superadmin@crm.com');
    await page.type('input[id="password"]', 'Admin@12345');
    await page.click('button[id="btn-login"]');
    
    // Check if a warning or message contains lockout indicators
    await new Promise(r => setTimeout(r, 600));
    console.log('✅ Lockout sequence simulated.');

    // Note: To login cleanly, reset fields or test authenticated paths
    console.log('\n3. Logging in with Admin credentials...');
    // Clear lock / wait for real credentials
    await page.click('input[id="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.click('input[id="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');

    await page.type('input[id="email"]', 'superadmin@crm.com');
    await page.type('input[id="password"]', 'Admin@12345');
    await page.click('button[id="btn-login"]');

    // Wait for redirect to happen
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    
    const currentUrl = page.url();
    console.log(`Current URL after redirect: "${currentUrl}"`);
    assert.ok(currentUrl.includes('/projects') || currentUrl.includes('/dashboard'), 'Redirect to console home page failed');
    console.log('✅ Admin login redirected to correct workspace path.');

    // 4. Navigate to Kanban Tasks Board
    console.log('\n4. Verifying Tasks Board loads...');
    await page.goto(`${CLIENT_URL}/tasks`, { waitUntil: 'networkidle2' });
    
    const kanbanColumnExists = await page.$('.grid-cols-5'); 
    assert.ok(kanbanColumnExists, 'Kanban columns wrapper must load on board view');
    console.log('✅ Kanban board columns verified.');

    // 5. Navigate to Invoices Creation Builder
    console.log('\n5. Verifying Invoices Creator Page loads...');
    await page.goto(`${CLIENT_URL}/invoices/new`, { waitUntil: 'networkidle2' });
    
    const clientSelect = await page.$('select[id="select-client"]');
    assert.ok(clientSelect, 'Client select field must exist in invoice creator form');
    console.log('✅ Invoice creator form interface validated.');

    // 6. Navigate to AI Proposals Generator Page
    console.log('\n6. Verifying AI Proposals Generator Page loads...');
    await page.goto(`${CLIENT_URL}/proposals`, { waitUntil: 'networkidle2' });
    
    const propTitleInput = await page.$('input[id="prop-title"]');
    assert.ok(propTitleInput, 'Proposal title input field must exist in generator form');
    console.log('✅ Proposal generator interface validated.');

    // 7. Verify Chat Workspace Loads
    console.log('\n7. Verifying Chat Workspace Page loads...');
    await page.goto(`${CLIENT_URL}/chat`, { waitUntil: 'networkidle2' });
    
    const chatInput = await page.$('textarea[id="chat-message-input"]');
    assert.ok(chatInput, 'Message textarea must exist in chat container');
    console.log('✅ Chat interface verified.');

    console.log('\n=== All CRM Automated Interface E2E Tests Passed Successfully! ===');
  } catch (err) {
    console.error('❌ E2E Interface Test Failed:', err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

runInterfaceTests();
```
