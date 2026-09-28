# PHASE 23: CODE FREEZE & FINAL DEPLOYMENT PROTOCOL

**STATUS: CODE FREEZE INITIATED**
The codebase is officially frozen as the Release Candidate. No further feature modifications, architectural changes, or seed data generation will occur. The database is in a strict Day 0 (empty) state.

## Terminology Protocol
To maintain strict operational discipline, subsystems must be classified using only the following states:

- **CODE IMPLEMENTED**: The logic exists in the codebase and compiles successfully (`npm run build`). No live endpoints are connected.
- **CONFIGURED**: External credentials and environment variables have been injected into the live hosting environment (Vercel/Supabase).
- **LIVE TESTED**: A controlled smoke test (e.g., sending a test email, uploading a test file) has been successfully executed on the live environment.
- **PRODUCTION VERIFIED**: The subsystem has processed real data in the live environment and successfully completed its lifecycle (including AuditLogs and Analytics).

---

## 1. Subsystem Status Matrix

| Subsystem | Current State | Required Next Step for Next State |
| :--- | :--- | :--- |
| **Prisma ORM & DB Schema** | **CODE IMPLEMENTED** | N/A (Schema synced) |
| **Supabase Storage** | **CODE IMPLEMENTED** | `CONFIGURED` (Verify bucket permissions on live) |
| **Authentication / RBAC** | **CODE IMPLEMENTED** | `LIVE TESTED` (Log in with test account on Vercel) |
| **Management Dashboard** | **CODE IMPLEMENTED** | `LIVE TESTED` (View on live URL) |
| **Document Upload (Signed URL)** | **CODE IMPLEMENTED** | `LIVE TESTED` (Upload test PDF on live URL) |
| **Power BI Endpoint** | **CODE IMPLEMENTED** | `CONFIGURED` (Connect PowerBI Service to live URL) |
| **Gemini AI Tools** | **CODE IMPLEMENTED** | `CONFIGURED` (Inject `GEMINI_API_KEY` to Vercel) |
| **Gmail API Webhook** | **CODE IMPLEMENTED** | `CONFIGURED` (Inject Google OAuth keys to Vercel) |
| **WhatsApp Meta Webhook** | **CODE IMPLEMENTED** | `CONFIGURED` (Inject Meta App Secret to Vercel) |
| **Audit Logging** | **CODE IMPLEMENTED** | `LIVE TESTED` (Verify logs appear in DB during live test) |

*Note: No subsystem is currently marked as `LIVE TESTED` or `PRODUCTION VERIFIED` because physical deployment and live URL exercises require human administrative execution outside of this sandbox.*

---

## 2. Final Deployment Checklist (Human Administrator)

### Step 1: Vercel Preparation
- [ ] Connect the GitHub repository to Vercel.
- [ ] Bind custom domain (`office.ukenterprise.in`).
- [ ] Verify TLS/HTTPS provisioning by Vercel.

### Step 2: Secret Injection (CONFIGURATION)
Inject the following into Vercel's Production Environment Variables:
- [ ] `DATABASE_URL` (Transaction pooled port 5432)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- [ ] `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`

### Step 3: Deployment
- [ ] Trigger Vercel Production Build.
- [ ] Verify build logs show `0` errors.

---

## 3. Controlled Live Verification Protocol (LIVE TESTED)

Once deployed, execute the following isolated tests. **Do not use real UK Enterprise project data.**

1. **Auth & RBAC Test:** Log into `office.ukenterprise.in` using a designated test `MASTER` account.
2. **Document Flow Test:** Upload `test-doc-001.pdf` via the browser. Verify it reaches the Supabase bucket.
3. **AI Flow Test:** Open the AI Chat interface. Ask: *"What is the status of the test project?"* Verify the AI returns the correct function call without crashing.
4. **Gmail Flow Test:** Send an email from an external account to the designated Pub/Sub address. Verify the webhook receives the payload and writes to `CommunicationLog`.
5. **WhatsApp Flow Test:** Send a test WhatsApp message from a whitelisted number. Verify the HMAC signature validates and logs the message.
6. **Audit Check:** Verify the Prisma `AuditLog` table contains records of the login and uploads.

### Step 4: Tear-Down (Pre-Production Cleanup)
Once all isolated tests pass:
- [ ] Delete `test-doc-001.pdf` from Supabase Storage.
- [ ] Delete all test Projects, Documents, and CommunicationLogs from the database.
- [ ] Verify the database is 100% empty (Day 0 state).

---

## 4. REAL DATA LOCK
🔒 **STATUS: ENFORCED**

Real UK Enterprise project onboarding, live vendor configuration, and actual financial BOQ data entry must **NOT** occur until every item in the Controlled Live Verification Protocol achieves **LIVE TESTED** status and the Pre-Production Cleanup is complete.
