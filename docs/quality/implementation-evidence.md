# Implementation evidence

Validated on 2026-10-01. The primary experience uses editable inputs and local domain computation or an explicitly labeled simulation. Optional live integrations are separate and are not required to try the demo.

- [Final command results](final-verification.json): tests, lint, TypeScript and production build, all exit 0. Detailed output is in `final-test.log`, `final-lint.log`, `final-types.log`, and `final-build.log`.
- [Frozen installation](setup-install.json): actual `pnpm install --frozen-lockfile`, exit 0. Tests after installation are recorded in `setup-test.log`. This validates the existing checkout, not a fresh empty clone.
- [Browser acceptance](browser-acceptance.json): English/Spanish runs, changed input invalidation, reset, cancellation, keyboard, mobile, reduced motion, storage failure, legacy redirects and no external/API requests in the primary flow.
- Actual screenshots: [English](../images/demo.png), [Spanish](../images/demo.es.png), [mobile](../images/demo.mobile.png), and [cover](../images/cover.png).

See the hub's `docs/quality/2026-10-01-portfolio-acceptance.md` for entry-route checks, public-link availability and cross-project limitations. The implementation is local and has not been deployed or published.
