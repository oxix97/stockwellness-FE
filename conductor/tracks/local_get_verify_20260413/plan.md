# Implementation Plan: Local Server Integration & GET Verification

## Phase 1: Environment & Setup
- [ ] Task: Ensure local environment is running
    - [ ] Verify local database and redis are running via docker-compose (`docker compose up -d` in `stockwellness`).
    - [ ] Verify local Spring Boot backend is running on port 8080 (`./gradlew :stockwellness-api:bootRun`).
    - [ ] Verify local Frontend is configured with `VITE_API_BASE_URL` pointing to the local backend and start the dev server (`npm run dev` in `stockwellness-front`).
- [ ] Task: Conductor - User Manual Verification 'Environment & Setup' (Protocol in workflow.md)

## Phase 2: Domain Verification (Frontend UI & Network)
- [ ] Task: Verify Auth / Member GET Endpoints
    - [ ] Login or setup local auth session.
    - [ ] Verify GET request for user profile/session state triggers `200 OK` in Network tab.
    - [ ] Verify response JSON structure unwraps correctly in UI.
- [ ] Task: Verify Portfolio GET Endpoints
    - [ ] Navigate to Portfolio page.
    - [ ] Verify GET requests for portfolio details and health diagnosis trigger `200 OK` in Network tab.
    - [ ] Verify response JSON structure unwraps correctly in UI.
- [ ] Task: Verify Stock / Sector GET Endpoints
    - [ ] Navigate to Home/Stock Search page.
    - [ ] Verify GET requests for stock prices, chart data, and AI sector insights trigger `200 OK` in Network tab.
    - [ ] Verify response JSON structure unwraps correctly in UI.
- [ ] Task: Verify Watchlist GET Endpoints
    - [ ] Navigate to Watchlist page.
    - [ ] Verify GET requests for watchlist groups and items trigger `200 OK` in Network tab.
    - [ ] Verify response JSON structure unwraps correctly in UI.
- [ ] Task: Conductor - User Manual Verification 'Domain Verification (Frontend UI & Network)' (Protocol in workflow.md)

## Phase 3: Finalize & Documentation
- [ ] Task: Summarize Verification Results
    - [ ] Document any failed requests, CORS issues, or parsing errors discovered during manual UI testing.
    - [ ] Create GitHub Issues for any bugs found (if applicable).
- [ ] Task: Conductor - User Manual Verification 'Finalize & Documentation' (Protocol in workflow.md)