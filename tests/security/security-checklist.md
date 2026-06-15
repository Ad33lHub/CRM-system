# Security Testing Checklist — CRM Software House

## Date: 2026-06-14
## Tester: QA Engineer (Phase 16)

---

## OWASP Top 10 Coverage

### 1. Injection (A03:2021)

| Check | Status | Evidence |
|-------|--------|----------|
| NoSQL injection in login body blocked | ✅ PASS | `express-mongo-sanitize` strips `$` operators (app.js L93) |
| NoSQL injection in query params blocked | ✅ PASS | `mongoSanitize()` middleware applied globally |
| Parameterized queries used (Mongoose) | ✅ PASS | All DB calls use Mongoose methods, not raw queries |

### 2. Broken Authentication (A07:2021)

| Check | Status | Evidence |
|-------|--------|----------|
| Password hashing with bcrypt (12 rounds) | ✅ PASS | User.model.js pre-save hook |
| Account lockout after 5 failed attempts | ✅ PASS | auth.controller.js L117, 2-hour lockout |
| Lockout persists (stored in MongoDB) | ✅ PASS | lockUntil field in User schema |
| Refresh token rotation | ✅ PASS | token.service.js rotateRefreshToken |
| Refresh token reuse detection | ✅ PASS | Invalidates entire token family |
| JWT expiry enforced | ✅ PASS | auth.middleware.js catches TokenExpiredError |
| Same error for wrong email/wrong password | ✅ PASS | "Invalid email or password" for both |

### 3. Sensitive Data Exposure (A02:2021)

| Check | Status | Evidence |
|-------|--------|----------|
| Password never in API response | ✅ PASS | User.model.js `select: false` + toJSON transform |
| Salary field hidden from non-admin | ✅ PASS | Employee.model.js `salary.amount: select: false` |
| refreshToken in httpOnly cookie only | ✅ PASS | auth.controller.js L136-141 |
| loginAttempts/lockUntil stripped from response | ✅ PASS | User.model.js toJSON transform |
| sanitizeUser utility removes sensitive fields | ✅ PASS | sanitizeResponse.js SENSITIVE_USER_FIELDS |

### 4. Security Headers (A05:2021)

| Header | Status | Configuration |
|--------|--------|---------------|
| Content-Security-Policy | ✅ SET | Helmet config in app.js L42-75 |
| X-Frame-Options: DENY | ✅ SET | `frameguard: { action: 'deny' }` |
| X-Content-Type-Options: nosniff | ✅ SET | `noSniff: true` |
| X-XSS-Protection | ✅ SET | `xssFilter: true` |
| X-Powered-By removed | ✅ SET | `hidePoweredBy: true` |
| Strict-Transport-Security (HSTS) | ✅ SET | Production only, 1 year max-age |
| Referrer-Policy | ✅ SET | `strict-origin-when-cross-origin` |
| Permissions-Policy | ✅ SET | Camera, microphone, geolocation disabled |

### 5. Rate Limiting (Brute Force Protection)

| Limiter | Config | Status |
|---------|--------|--------|
| Auth endpoints | 5 req/15min (prod) | ✅ ACTIVE |
| Registration | 3 req/hour | ✅ ACTIVE |
| General API | 100 req/min | ✅ ACTIVE |
| Upload | 30/hour | ✅ ACTIVE |
| AI endpoints | 20/hour | ✅ ACTIVE |
| Export | 10/hour | ✅ ACTIVE |
| Rate limit headers (draft-7) | standardHeaders: 'draft-7' | ✅ ACTIVE |
| Retry-After on 429 | Set in handler | ✅ ACTIVE |

### 6. Authorization / RBAC

| Check | Status | Evidence |
|-------|--------|----------|
| Role-based permissions defined | ✅ PASS | rbac.middleware.js PERMISSIONS object |
| checkRole middleware enforces roles | ✅ PASS | Used on protected routes |
| checkPermission for resource+action | ✅ PASS | Granular resource permissions |
| checkOwnership prevents cross-user access | ✅ PASS | Ownership verification middleware |
| clientPortalGuard restricts client access | ✅ PASS | Clients see only their own data |
| Developer cannot access salary endpoint | ✅ PASS | salary.amount `select: false` + RBAC |

### 7. Input Validation

| Check | Status | Evidence |
|-------|--------|----------|
| Zod validation on auth routes | ✅ PASS | validate.middleware.js + auth.validator.js |
| Request body size limited (10kb) | ✅ PASS | app.js L88 `express.json({ limit: '10kb' })` |
| File upload validation | ✅ PASS | fileValidation.middleware.js |
| XSS prevention via mongo-sanitize | ✅ PASS | Strips `$` and `.` from input |

### 8. Cookie Security

| Flag | Status | Notes |
|------|--------|-------|
| httpOnly | ✅ SET | Prevents JavaScript access |
| secure | ⚠️ PROD ONLY | Set when NODE_ENV === 'production' |
| sameSite: strict | ✅ SET | CSRF protection |
| maxAge: 7 days | ✅ SET | Token expiration |

---

## Security Vulnerabilities Found

### Critical: 0
### High: 0
### Medium: 0
### Low: 1

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | LOW | Cookie `secure` flag only in production | DOCUMENTED — By design for local dev |

---

## Sign-Off

- [x] All Critical security issues: NONE FOUND
- [x] All High security issues: NONE FOUND
- [x] Security headers verified via Helmet configuration
- [x] Rate limiting active on all endpoint categories
- [x] Input sanitization (mongo-sanitize) active globally
- [x] RBAC enforced on all protected routes
- [x] Sensitive data never exposed in API responses
- [x] Refresh token reuse detection implemented
- [x] Account lockout persists in MongoDB (survives restarts)
