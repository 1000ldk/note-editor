# Testing Requirements

- NEVER implement a new feature without writing and verifying an E2E test for it.
- We use Playwright for our E2E testing framework.
- Tests should cover typical user flows, including edge cases like validation errors or missing authentication.
- All new tests must be placed in the `frontend/tests/` directory with the `.spec.ts` suffix.
- When generating code, make sure to execute the test suite (e.g., `npx playwright test` in `frontend` folder) and confirm it passes before concluding your task.

## Rules
1. Before proposing the code is complete, run the related playwright tests to verify the UI behavior behaves exactly as implemented.
2. Ensure you have the playwright webserver started or that your playwright configuration boots the dev server correctly.
3. Don't mock out the database unless strictly required; strive to perform realistic e2e scenarios.