# Contributing to kyc-antifraude

Thanks for taking the time to improve this project. Issues and pull requests are welcome.

## Before you start

- Search [existing issues](https://github.com/mdeasis27/kyc-antifraude/issues) to avoid duplicates.
- For anything larger than a small fix, open an issue first so we can agree on the approach.
- By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Set up

You need Node 22 and [pnpm](https://pnpm.io) 10.

```bash
git clone https://github.com/mdeasis27/kyc-antifraude.git
cd kyc-antifraude
pnpm install
pnpm dev
```

## Make a change

1. Fork the repository and create a branch from `main` named for the intent: `feat/…`, `fix/…`, `docs/…` or `chore/…`.
2. Keep the change focused: one logical change per pull request.
3. Add or update tests when behavior changes.
4. Make sure the checks pass locally:

   ```bash
   pnpm lint
   pnpm test   # if the project defines tests
   pnpm build
   ```

5. Commit with [Conventional Commits](https://www.conventionalcommits.org) (`feat: …`, `fix: …`, `docs: …`).
6. Open a pull request and fill in the template. CI must be green before review.

## Style

- TypeScript in strict mode: no `any`, no `@ts-ignore`.
- Money values are integers in cents, never floats.
- Code, comments and commit messages are in English. User-facing text follows the project's languages (English and Spanish).
- Demos must keep working without API keys (demo mode).

## Reporting bugs and ideas

Use the issue templates. Include steps to reproduce, what you expected and what happened. Security problems go through [SECURITY.md](SECURITY.md), not public issues.
