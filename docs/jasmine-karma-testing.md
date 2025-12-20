# Jasmine + Karma + Grunt + Bower Unit Testing Blueprint (TypeScript-first)

This guide explains how to harden the `simer-node-demo` e-commerce app (Node.js backend with Angular + React frontends) with a production-grade, TypeScript-friendly unit testing toolchain built on Jasmine, Karma, Grunt, and (where unavoidable) Bower. It emphasises DRY, KISS, SOLID, and 12-factor principles so both frontends stay consistent while the backend remains the single source of truth.

## Objectives

- **Robustness:** Fast unit feedback loops with consistent assertions, coverage, and CI-friendly runs.
- **Maintainability:** Shared contracts and deterministic configs so Angular and React behave identically against the backend API.
- **Configurable:** Environment-driven config; no hard-coded URLs or credentials in specs.
- **Optimised:** Lean builds (headless browsers, multi-stage CI steps) that avoid duplicating logic between Angular and React.

## Toolchain overview

| Tool | Role | Why |
| --- | --- | --- |
| **Jasmine** | Assertion/BDD layer for both frontends. | Familiar API, matches existing Angular defaults. |
| **Karma** | Test runner + browser orchestrator for Angular and optional React specs. | Handles real browser APIs and coverage. |
| **Grunt** | Task runner to compose lint → unit → coverage → report for CI. | Keeps pipelines declarative and DRY. |
| **Bower (legacy-only)** | Vendor fetches when a library is not npm-packaged (avoid unless required). | Prevents ad-hoc CDN scripts inside specs. |

> ✅ Prefer npm packages whenever possible; fall back to Bower only for vendor gaps, and vendor-lock assets into `frontend-angular/lib/` to keep builds hermetic.

## Architectural alignment

- **Backend-first contract:** Generate/OpenAPI clients once and stub API calls in tests to prevent Angular vs React drift (both consume the same DTOs).
- **Feature-based testing:** Mirror feature folders (`frontend-angular/src/app/features/*`, `frontend/src/features/*`). Each feature owns its specs and fixtures to maintain SRP and reduce coupling.
- **Cross-frontend parity:** Shared helper utilities (e.g., factories, mock API responses) live under `frontend/testing/` and `frontend-angular/src/testing/` to avoid duplication.

## Prerequisites

- Node.js 18+ and npm installed.
- Chrome/Chromium available on the runner (for Karma). In CI, use `chrome-headless`.
- Global CLIs (optional): `npm i -g grunt-cli bower` for local convenience. CI should use `npx` to avoid global mutations.

## Angular setup (Jasmine + Karma)

Angular already ships with Jasmine/Karma scaffolding (`frontend-angular/karma.conf.js`, `tsconfig.spec.json`, and `npm test`). Harden it as follows:

1. Install/update test dependencies (headless-ready and typed):
   ```bash
   cd frontend-angular
   npm install --save-dev \
     jasmine-core @types/jasmine karma karma-jasmine karma-chrome-launcher \
     karma-coverage karma-jasmine-html-reporter \
     grunt grunt-karma karma-junit-reporter
   ```
2. Ensure TypeScript spec config stays strict and DRY:
   - In `tsconfig.spec.json`, extend `./tsconfig.json` and enable `strict`, `noUnusedLocals`, and `noImplicitAny` to surface dead code in tests.
3. Adopt a Grunt entrypoint (add `Gruntfile.js`):
   ```js
   module.exports = function (grunt) {
     grunt.initConfig({
       karma: {
         unit: {
           configFile: 'karma.conf.js',
           singleRun: true,
           browsers: ['ChromeHeadless'],
           reporters: ['progress', 'kjhtml', 'coverage', 'junit'],
           junitReporter: { outputDir: 'coverage/junit' },
         },
       },
     });
     grunt.loadNpmTasks('grunt-karma');
     grunt.registerTask('test', ['karma:unit']);
   };
   ```
4. Keep `karma.conf.js` aligned with production code:
   - Use `ChromeHeadless` in CI to avoid display dependencies.
   - Set `singleRun: true` for CI; keep `restartOnFileChange: true` for local TDD.
   - Store coverage in `./coverage/frontend-angular` and fail builds under a minimum threshold (e.g., 80% statements).
5. Authoring guidelines:
   - **Arrange-Act-Assert** per spec; keep factory functions in `src/testing/`.
   - Prefer **TestBed** + **HttpClientTestingModule**; never call real endpoints.
   - Use **OnPush-safe** fixture setup (`fixture.detectChanges()` after inputs) to match production change detection.

## React setup (Jasmine + Karma with TypeScript)

While React commonly uses Jest/Vitest, you can stay on the same runner to align behavior across frontends.

1. Add dependencies:
   ```bash
   cd frontend
   npm install --save-dev \
     jasmine-core @types/jasmine karma karma-jasmine karma-chrome-launcher \
     karma-coverage karma-typescript karma-junit-reporter \
     grunt grunt-karma @types/node
   ```
2. Create `karma.conf.js` in `frontend/`:
   ```js
   module.exports = function (config) {
     config.set({
       basePath: '',
       frameworks: ['jasmine', 'karma-typescript'],
       files: ['src/**/*.ts', 'src/**/*.tsx'],
       preprocessors: { 'src/**/*.(ts|tsx)': ['karma-typescript'] },
       reporters: ['progress', 'karma-typescript', 'coverage', 'junit'],
       browsers: ['ChromeHeadless'],
       singleRun: true,
       karmaTypescriptConfig: { tsconfig: './tsconfig.json' },
       junitReporter: { outputDir: 'coverage/junit' },
       coverageReporter: { dir: 'coverage', reporters: [{ type: 'html' }, { type: 'text-summary' }] },
     });
   };
   ```
3. Wire Grunt for symmetry (`frontend/Gruntfile.js`):
   ```js
   module.exports = function (grunt) {
     grunt.initConfig({
       karma: { unit: { configFile: 'karma.conf.js', singleRun: true } },
     });
     grunt.loadNpmTasks('grunt-karma');
     grunt.registerTask('test', ['karma:unit']);
   };
   ```
4. React testing patterns:
   - Use **React Testing Library** helpers inside Jasmine specs for DOM assertions.
   - Mock fetch/axios with **MSW** or **fetch-mock**; never hit the live API.
   - Keep hooks pure; test side effects through **act()** to reflect real render timing.

## Bower usage (only when npm is unavailable)

- Place `bower.json` alongside the relevant frontend (`frontend-angular/bower.json` or `frontend/bower.json`) and pin exact versions.
- After `bower install`, copy assets into `src/assets/vendor/` and reference them via Angular/React build steps—do **not** hit `bower_components/` at runtime.
- Add a Grunt task (`grunt-contrib-copy`) to vendor-lock assets during CI builds, keeping Docker layers deterministic.

## CI/CD and quality gates

- **Single entrypoint:** Use `npm test` (Angular) and `npm run grunt test` (React) so Jenkins/GitHub Actions can call consistent commands.
- **Fail fast:** Enforce `singleRun: true`, headless browsers, and coverage thresholds to block regressions.
- **Artifacts:** Publish `coverage/` (HTML + text-summary) and `coverage/junit/*.xml` for pipeline visibility.
- **12-factor ready:** Pass API base URLs to tests via env vars (e.g., `VITE_API_BASE_URL=http://localhost:4000`) and stub network calls based on those values.
- **Headless coverage preview:** Set `COVERAGE_PREVIEW=1` when invoking `npm test` to auto-open the generated `coverage/index.html` (React) or `coverage/frontend-angular/index.html` (Angular) in headless Chrome via `scripts/open-coverage.js`.

## Safeguards against breaking existing flows

- Keep specs isolated with **dependency injection** and **factory functions**; never mutate shared state.
- Use **test doubles** for backend responses that match the OpenAPI contract to keep Angular and React in sync.
- Run tests in CI before Docker image builds to fail early.
- Prefer **small, deterministic fixtures** to keep runs fast and avoid flaky behavior.

## Quick commands

```bash
# Angular (watch mode for TDD)
cd frontend-angular && npm test

# Angular (CI, headless, single run)
cd frontend-angular && npx grunt test

# React (CI, headless, single run)
cd frontend && npx grunt test

# Coverage preview toggle (headless Chrome)
COVERAGE_PREVIEW=1 npm test
```

## Ongoing maintenance checklist

- Keep `karma.conf.js` and `tsconfig.spec.json` aligned with compiler options used for builds.
- Audit dependencies quarterly; remove unused Bower entries and prefer npm equivalents.
- Track coverage trends; raise thresholds gradually as features stabilize.
- Share fixtures across frontends for identical behaviors and error handling.
