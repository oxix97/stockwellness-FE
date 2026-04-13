# Verification Results: Local Server Integration & GET Verification

## Summary
- **Backend Status:** Running on port 8080 (Java/Spring Boot).
- **Frontend Status:** Running on port 5173 (Node/Vite).
- **Configuration:** Updated `stockwellness-front/.env` to point `VITE_API_BASE_URL` to `http://localhost:8080`.
- **Proxy Verification:** `vite.config.ts` correctly proxies `/api` and `/oauth2` to the backend.

## Endpoint Verification (via curl)
| Endpoint | Method | Result | Notes |
|---|---|---|---|
| `/api/v1/auth/test` | GET | `200 OK` | Confirmed connectivity and ApiResponse structure. |
| `/api/v1/stocks/popular-search` | GET | `200 OK` | Publicly accessible. |
| `/api/v1/sectors/ranking/fluctuation` | GET | `200 OK` | Publicly accessible. |
| `/api/v1/stocks/new-listings` | GET | `401 Unauthorized` | Expected; SecurityConfig requires authentication for this. |
| `/api/v1/stocks/ranking/supply` | GET | `401 Unauthorized` | Expected; SecurityConfig requires authentication for this. |

## Bug/Issue Findings
1. **Security Policy Inconsistency:** Some endpoints like `new-listings` and `ranking/supply` in `StockController` do not have `@AuthenticationPrincipal` but are still blocked by `SecurityConfig`. If these were intended to be public, `SecurityConfig.permitPatterns()` needs to be updated.
2. **AI Sector Insights:** The `aiComment` field in sector fluctuation ranking returned "데이터 부족으로 진단이 불가능합니다." (Diagnosis impossible due to lack of data), which is a graceful fallback but indicates data/prompt issues in the local environment.

## Next Steps
- [ ] Implement local JWT generation tool for deeper testing of protected endpoints (Portfolio, Watchlist, Member).
- [ ] Verify frontend UI behavior by manually navigating the local dev server (requires login).
