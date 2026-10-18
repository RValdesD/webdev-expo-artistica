# Final fixes

## Incorporate this version

Back up your existing project. Copy the updated source and configuration files
into your art-expo folder, preserving your backend/.env and custom images.
Run `npm install` from the root to install the new test dependency.
Use `npm run server` and `npm run dev` in separate terminals for development.

Changed files: backend/src/controllers/workshopsController.ts,
backend/src/utils/middleware.ts, backend/src/app.ts,
frontend/src/services/login.ts, frontend/src/pages/Information.tsx,
root and backend package.json, and package-lock.json.

New files: backend/tests/session-client.test.ts,
backend/tests/integration/database.test.ts, requests.rest, DEPLOYMENT.md,
and .github/workflows/check.yml.

## Behavior

- Workshop capacity updates reject numeric strings and capacity below enrollment
  with 400. The enrollment count check and update are atomic.
- Public workshops remain readable with expired cookies. Protected operations
  still require a valid session.
- Failed network/server logout preserves CSRF and the logged-in UI for retry.
  Successful logout or an expired session clears local credentials.
- Visitas now targets the visit information, accessibility and FAQ section.
- Production Express serves the React build and supports direct route refreshes.
- requests.rest includes authentication, CRUD and registration examples. Replace
  its placeholders with your own credentials and login response tokens; grant
  organizer access using the documented CLI before trying management writes.

## Verification and remaining work

Production frontend/backend build: passed.
Unit, authorization and client-session tests: 35 passed.
Built frontend root/deep-link responses and unknown API JSON 404: passed.

The new real-MongoDB integration suite could not execute in the editing
environment: MongoDB exited during startup with `open: Operation not permitted`.
Run `npm run test:integration` locally or via the included GitHub Actions workflow
before considering the database integration checks complete.

Repository publication and live hosting remain pending your repository/hosting
destination and access. DEPLOYMENT.md contains the prepared commands and settings.
