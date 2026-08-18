# AstroViewer CI/CD and Release Process

This document defines the development, validation, and release workflow for
`astro-viewer`.

AstroViewer follows a dual-license model:

- GNU Affero General Public License v3.0 (`AGPL-3.0`)
- separate commercial licensing

See:

- `LICENSE.md`
- `LICENSE-AGPL.md`
- `LICENSE-COMMERCIAL.md`
- `DEPENDENCY-LICENSING.md`

## Branching model

The repository uses the following branches:

```text
dev
 │
 ├── feature/*
 │
 └── release/<version>
          │
          ▼
        main
          │
          ▼
      v<version>
```

### `dev`

Main development branch.

New development and dependency updates are integrated here.

Development versions use the following convention:

```text
<next-version>-snapshot
```

Example:

```text
3.6.0-snapshot
```

### `release/<version>`

Temporary release-preparation branch created from `dev`.

Example:

```text
release/3.6.0
```

Only release-related changes should normally be made on this branch.

### `main`

Stable release branch.

Every commit used for a published release must reach `main` through the release
process.

### Release tags

Stable releases are tagged using:

```text
v<version>
```

Example:

```text
v3.6.0
```

## Continuous Integration

GitHub Actions runs CI on pushes and pull requests.

The current CI workflow is defined in:

```text
.github/workflows/ci.yml
```

The minimum CI pipeline is:

```text
npm ci
npm test
npm run build
```

A release must not proceed if CI fails.

## Local validation

Before preparing a release, run:

```bash
npm ci
npm test
npm run build
npm pack --dry-run
```

Also verify the runtime dependency tree:

```bash
npm ls astrospatial-core wcslight jsfitsio gl-matrix cross-fetch
```

And check the security posture:

```bash
npm audit
npm audit --omit=dev
```

Review unexpected vulnerabilities or dependency changes before proceeding.

## Generated artifacts

The following directories contain generated build artifacts:

```text
dist/
lib-esm/
public/
```

They must not be treated as source files.

The build process generates:

```text
dist/
lib-esm/
```

The development web environment is generated with:

```bash
npm run web
```

which recreates:

```text
public/
```

from the current build artifacts and the files under:

```text
src/html/
```

Generated artifacts must not be committed to the repository.

A clean rebuild can be verified with:

```bash
rm -rf dist lib-esm public

npm run build
npm run web
```

## Preparing a release

Start from an up-to-date `dev` branch:

```bash
git checkout dev
git pull origin dev
```

Create the release branch:

```bash
git checkout -b release/<version>
```

For example:

```bash
git checkout -b release/3.6.0
```

Set the release version:

```bash
npm version <version> --no-git-tag-version
```

For example:

```bash
npm version 3.6.0 --no-git-tag-version
```

This updates:

```text
package.json
package-lock.json
```

## Release validation

Run the complete release validation:

```bash
npm ci
npm test
npm run build
npm pack --dry-run

npm ls astrospatial-core wcslight jsfitsio gl-matrix cross-fetch

npm audit
npm audit --omit=dev
```

Check that generated artifacts do not accidentally enter the Git repository:

```bash
git status --short
```

Verify that source maps and other unwanted generated files are not included in
the npm package:

```bash
npm pack --dry-run
```

Review the package contents carefully before publishing.

## Commit the release

After validation:

```bash
git status
git add package.json package-lock.json
git commit -m "Prepare release <version>"
```

Include other files only when they were intentionally modified as part of the
release.

Push the release branch:

```bash
git push -u origin release/<version>
```

Example:

```bash
git push -u origin release/3.6.0
```

Open a pull request:

```text
release/<version> -> main
```

CI must pass before merging.

## Creating the release tag

After the release pull request has been merged:

```bash
git checkout main
git pull origin main
```

Verify the version:

```bash
node -p "require('./package.json').version"
```

Run the final validation:

```bash
npm ci
npm test
npm run build
npm pack --dry-run
```

Create the annotated release tag:

```bash
git tag -a v<version> -m "Release v<version>"
```

Example:

```bash
git tag -a v3.6.0 -m "Release v3.6.0"
```

Push the tag:

```bash
git push origin v<version>
```

## Package publication

Package publication must use the registry and distribution channel defined for
the corresponding AstroViewer release.

Before publishing, verify:

```bash
npm whoami
npm config get registry
npm pack --dry-run
```

Do not publish development versions such as:

```text
3.6.0-snapshot
```

as stable releases.

The package version must exactly match the Git tag:

```text
package.json: 3.6.0
Git tag:      v3.6.0
```

## Post-release development

After the release has been completed, synchronize `dev` with `main`:

```bash
git checkout dev
git pull origin dev
git merge main
```

Set the next development version:

```bash
npm version <next-version>-snapshot --no-git-tag-version
```

For example:

```bash
npm version 3.7.0-snapshot --no-git-tag-version
```

Commit the new development version:

```bash
git add package.json package-lock.json
git commit -m "Start <next-version>-snapshot development"
git push origin dev
```

## Release checklist

Before every stable release verify:

- CI passes
- tests pass
- production build succeeds
- `npm pack --dry-run` contains only intended files
- generated directories are not tracked by Git
- dependency versions are correct
- dependency licensing has been reviewed
- `npm audit` results have been reviewed
- `package.json` contains the stable release version
- the Git tag matches the package version
- licensing files are present and consistent
- `DEPENDENCY-LICENSING.md` reflects the current dependency tree

## Licensing files

Every release repository must retain:

```text
LICENSE.md
LICENSE-AGPL.md
LICENSE-COMMERCIAL.md
DEPENDENCY-LICENSING.md
```

The obsolete:

```text
LICENSE-NONCOMMERCIAL.md
```

must not be restored.

## Release principle

A release is considered valid only when the source commit, package version,
dependency state, licensing metadata, CI result, and Git tag all refer to the
same release state.