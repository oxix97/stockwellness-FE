# Implementation Plan: Local Server Integration & GET Verification

## Phase 1: Environment & Setup
- [x] Task: Ensure local environment is running
    - [x] Verify local database and redis are running via docker-compose (User: "docker 서버 안띄워도 괜찮아" - Skipped composition, verified ports).
    - [x] Verify local Spring Boot backend is running on port 8080 (`./gradlew :stockwellness-api:bootRun`).
    - [x] Verify local Frontend is configured with `VITE_API_BASE_URL` pointing to the local backend and start the dev server (`npm run dev` in `stockwellness-front`).
- [x] Task: Conductor - User Manual Verification 'Environment & Setup' (Protocol in workflow.md)
## Phase 2: Domain Verification (Frontend UI & Network)
- [x] Task: Verify Auth / Member GET Endpoints
    - [x] Login or setup local auth session (Verified via `curl /api/v1/auth/login`).
    - [x] Implement local JWT generation tool for deeper testing of protected endpoints (`scripts/gen-local-auth.js`).
    - [x] Verify frontend UI behavior by manually navigating the local dev server (requires login).
    - [x] Verify GET request for user profile/session state triggers `200 OK` in Network tab.
    - [x] Verify response JSON structure unwraps correctly in UI (Fixed `validateDOMNesting` warning in `More.tsx`).
- [x] Task: Verify Portfolio GET Endpoints
    - [x] Navigate to Portfolio page.
    - [x] Verify GET requests for portfolio details and health diagnosis trigger `200 OK` in Network tab (Verified via `curl` with new portfolio ID 16).
- [x] Task: Verify Stock / Sector GET Endpoints
    - [x] Navigate to Home/Stock Search page.
    - [x] Verify GET requests for stock prices, chart data, and AI sector insights trigger `200 OK` in Network tab (Verified via `curl` and manual proxy check).
- [x] Task: Verify Watchlist GET Endpoints
    - [x] Navigate to Watchlist page.
    - [x] Verify GET requests for watchlist groups and items trigger `200 OK` in Network tab (Fixed layout issue where Edit Group button was blocked by Bottom Nav).
- [x] Task: Conductor - User Manual Verification 'Domain Verification (Frontend UI & Network)' (Protocol in workflow.md)

## Phase 3: Finalize & Documentation
- [~] Task: Summarize Verification Results
    - [ ] Document any failed requests, CORS issues, or parsing errors discovered during manual UI testing.
    - [ ] Create a verification report file (`verification_report.md`).
- [ ] Task: Create GitHub Issues (if needed)
    - [ ] Log identified bugs or alignment gaps as separate issues.
- [ ] Task: Track Completion
    - [ ] Update `conductor/tracks.md` and move the track to `archive/`.
    - [ ] Create GitHub Issues for any bugs found (if applicable).
- [ ] Task: Conductor - User Manual Verification 'Finalize & Documentation' (Protocol in workflow.md)
