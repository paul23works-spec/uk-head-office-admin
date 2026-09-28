# Production Error Audit Report

## 1. Executive Summary
The UK Enterprise application is currently suffering from a split-brain architecture where the frontend (React UI) and the backend (PostgreSQL + Supabase Storage) are completely disconnected for core entity management. The UI relies almost entirely on `localStorage` and hardcoded mock data, while the backend contains the actual production data. This fundamental disconnect is the root cause of the inconsistent behavior, missing files, and "demo data" appearing in production.

## 2. Root Cause Analysis

### A. The "Split-Brain" State Management
- **Frontend (Client-Side):** The application relies on `ProjectContext` (in `src/lib/project-context.tsx`) which initializes with `INITIAL_PROJECTS` from `mock-data.ts` and persists changes exclusively to the browser's `localStorage`.
- **Backend (Server-Side):** There is a functional PostgreSQL database with Prisma ORM and Supabase Storage that correctly holds the 49 verified Bongaigaon documents and 1 Bongaigaon project record.
- **The Issue:** The React components do not fetch data from the PostgreSQL database. When a user interacts with the application, they are viewing and modifying local browser state, which explains why demo projects ("Baksa Medical College" created locally by users or remaining in their cache) appear, and why the 49 real documents in the database are not correctly reflected in the UI.

### B. Project ID Mismatch (UUID vs. String ID)
- **Database Schema:** The Prisma schema defines the primary key (`id`) of the `Project` model as a UUID (e.g., `739bed9a-5b64-4c1e-900b-e753ae6274c9`). It also has a string field `projectId` (e.g., `PRJ-2024-001`).
- **Storage Paths:** Documents were successfully uploaded to Supabase Storage under `projects/PRJ-2024-001/...` instead of the UUID.
- **Database Foreign Keys:** The `Document` table correctly links to the `Project` via the UUID foreign key (`projectId: '739bed9a-5b64-4c1e-900b-e753ae6274c9'`).
- **The Issue:** The frontend code uses the string identifier (`PRJ-2024-001`) as the primary `id`. When API routes (like the document upload/fetch routes) attempt to join or query records, this discrepancy between UUIDs and string IDs causes lookups to fail or documents to be orphaned.

### C. The "Project-per-Document" UI Issue
Because the frontend state relies on mock data and local storage, the UI components attempt to map documents to projects using hardcoded references. If the backend API routes were used to fetch documents, they would return data structured differently than what the frontend's `ProjectContext` expects, leading to rendering errors where documents might mistakenly be treated as top-level entities or fail to nest under their actual project.

### D. Supabase Storage Verification
- The 49 documents for Bongaigaon Medical College successfully migrated.
- They are located in the `uk-enterprise-documents` bucket under the `projects/PRJ-2024-001/` prefix.
- The PostgreSQL database has exactly 69 document records total (some are duplicates or test files from earlier migrations). 
- The database contains exactly 1 Project record: "Bongaigaon Medical College" (UUID: `739bed9a-5b64-4c1e-900b-e753ae6274c9`).

## 3. Recommended Remediation Plan (To be executed upon approval)

1. **Purge Mock Data & LocalStorage Dependency:**
   - Remove `INITIAL_PROJECTS` and all related mock data from `mock-data.ts`.
   - Refactor `ProjectContext` to fetch data from Next.js API routes (which query Postgres) instead of hydrating from `localStorage`.
   - Ensure the UI enforces the single source of truth (the database).

2. **Resolve the UUID vs. String ID Conflict:**
   - Standardize how projects are referenced across the stack. We must update the API routes and frontend to consistently use the UUID (`739bed9a-5b64-4c1e-900b-e753ae6274c9`) for database joins, while using `PRJ-2024-001` only for display purposes (or as the storage prefix, if preferred).

3. **Cleanup Database Orphans:**
   - There are 69 document records in the database but only 49 valid Bongaigaon documents in Supabase. The 20 orphaned or test database records need to be carefully purged to align the DB exactly with the 49 real documents.

**Awaiting your approval to begin executing Phase 1 of this remediation plan.**
