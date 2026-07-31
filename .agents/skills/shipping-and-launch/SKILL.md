---
name: shipping-and-launch
description: Guides packaging, versioning, publishing to npm, deploying, and launching software releases safely. Use whenever releasing a new version after changes are made or when publishing packages to npm.
---

# Shipping and Launch

## Overview

Releasing code into production or publishing packages to npm is the final bridge between development and users. Every release must be deterministic, tested, tagged, documented in a changelog, and published cleanly without breaking downstream consumers.

## When to Use

- When any code change is complete and ready for release
- When bumping package versions and publishing updates to npm
- When creating git release tags and pushing release commits
- When generating or updating release notes and changelogs

## Release & NPM Publishing Workflow

### 1. Pre-Release Quality & Hygiene Checks

Before initiating a release or version bump:
- Ensure all automated tests pass: `pnpm test` or `npm test`
- Ensure code builds cleanly without errors: `pnpm build` or `npm run build`
- Ensure code passes type checks and linter: `pnpm typecheck` / `npx tsc --noEmit`
- Ensure working directory is clean: `git status` (no uncommitted local state)

### 2. Version Selection (Semantic Versioning)

Determine the release impact:
- **PATCH** (`x.x.N+1`): Bug fixes, refactors, internal non-breaking optimizations.
- **MINOR** (`x.N+1.0`): New features or non-breaking API additions.
- **MAJOR** (`N+1.0.0`): Breaking changes, removed APIs, altered contracts.

### 3. Release Execution Strategies

#### Strategy A: Automated CI/CD via GitHub Actions & Changesets (Recommended for @bolkauth/*)

This project uses `@changesets/cli` with `.github/workflows/release.yml` for automated releases on npm.

1. **Create a Changeset**:
   ```bash
   pnpm changeset
   ```
   *Follow the prompts to select which packages (`@bolkauth/core`, `@bolkauth/react`, etc.) receive a patch/minor/major bump and enter a description.*

2. **Commit & Push**:
   ```bash
   git add .changeset/
   git commit -m "chore: add changeset for release"
   git push origin main
   ```

3. **Automated Publishing via GitHub Actions**:
   - The `.github/workflows/release.yml` pipeline triggers on push to `main`.
   - `changesets/action` consumes pending changesets, opens/updates a "Version Packages" release PR, or automatically runs `pnpm changeset publish` using `NPM_TOKEN` when merged.

---

#### Strategy B: Manual CLI Release (Local Execution)

If publishing directly from terminal:

```bash
# 1. Create a changeset file describing the change and semver bump
pnpm changeset

# 2. Consume changesets to bump package versions & update CHANGELOG.md files
pnpm changeset version

# 3. Commit version updates and updated changelogs
git add .
git commit -m "chore(release): version packages"

# 4. Run full build and test suite
pnpm build
pnpm test

# 5. Publish updated packages to NPM registry
pnpm changeset publish
```

---

#### Strategy C: Single-Package Standard NPM Projects

```bash
# 1. Bump version in package.json (automatically creates a git tag)
npm version patch  # or minor / major

# 2. Ensure CHANGELOG.md has a curated entry for the version

# 3. Commit release changes if not automatically done
git add .
git commit -m "chore(release): bump version"

# 4. Run clean build and test suite
npm run build
npm test

# 5. Publish package to NPM
npm publish --access public
```

### 4. Tagging and Git Remote Push

- Verify git release tags exist (e.g., `v0.1.0` or `@bolkauth/core@0.1.0`).
- Push main branch along with release tags to GitHub:
  ```bash
  git push origin main --tags
  ```

## Golden Rules for NPM Publishing

1. **Clean Builds Only**: Never publish built artifacts compiled from dirty or uncommitted source states.
2. **Never Force Overwrite**: NPM versions are immutable once published. Never attempt to force re-publish an existing version.
3. **Scoped Package Access**: Always include `"access": "public"` in `.changeset/config.json` or `--access public` when publishing scoped packages (`@bolkauth/*`).
4. **Authenticity**: Confirm active session with `npm whoami` or verify `NPM_TOKEN` in GitHub Secrets (`Settings ➔ Secrets and variables ➔ Actions`).
