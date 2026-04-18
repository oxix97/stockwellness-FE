# Specification: Local Server Integration & GET Verification

## Overview
This track aims to verify the end-to-end local integration between the Frontend React application and the Backend Spring Boot API. The goal is to manually trigger GET requests across all primary domains via the Frontend UI and ensure that the backend responds correctly.

## Functional Requirements
1. **Environment Configuration:** Ensure the frontend is properly configured to point to the local backend (e.g., `VITE_API_BASE_URL=http://localhost:8080/api`).
2. **UI-Driven Execution:** Execute GET requests by navigating the frontend application and triggering data fetches for the following domains:
   - **Auth / Member:** Fetching user profile/session state.
   - **Portfolio:** Fetching portfolio data, health diagnosis, and backtest results.
   - **Stock / Sector:** Fetching stock prices, chart data, and AI sector insights.
   - **Watchlist:** Fetching the user's watchlist groups and items.
3. **Response Validation:** Observe the Browser's Network Tab and Console to verify:
   - The HTTP Status Code is `200 OK`.
   - The response payload adheres to the standard API wrapper format: `{"data": {...}, "timestamp": "..."}`.
   - The frontend correctly unwraps the `data` field and renders the UI without parsing errors.

## Acceptance Criteria
- [ ] The local Frontend app successfully proxies/communicates with the local Backend without CORS issues.
- [ ] UI navigation triggers the corresponding GET endpoints for Auth, Portfolio, Stock, and Watchlist.
- [ ] All tested GET endpoints return a `200 OK` status and the standard structured JSON payload.
- [ ] The Frontend successfully renders the received data without throwing console errors or blank screens.

## Out of Scope
- Verification of data mutation operations (POST, PUT, DELETE), except where necessary to seed data for a GET request.
- Writing new automated End-to-End (E2E) or unit tests.
- Performance or load testing of the endpoints.