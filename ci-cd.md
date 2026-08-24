# AstroViewer CI/CD

Operational workflow for development and npm releases.

## 1. Development

Development happens on `dev` using snapshot versions:

```text
3.9.0-snapshot
```

Feature branches start from `dev`:

```bash
git checkout dev
git pull --ff-only origin dev

git checkout -b feature/<name>
```

Before merging a feature:

```bash
npm test
npm run build

git status
git add .
git commit -m "<message>"
git push -u origin feature/<name>
```

Merge the feature into `dev` and push:

```bash
git checkout dev
git pull --ff-only origin dev

git merge feature/<name>
git push origin dev
```

---

## 2. Validate `dev`

Before starting a release:

```bash
git checkout dev
git pull --ff-only origin dev

git status
node -p "require('./package.json').version"

npm test
npm run build
npm pack --dry-run
```

Expected version:

```text
<version>-snapshot
```

Example:

```text
3.9.0-snapshot
```

---

## 3. Create Release Branch

Example release: `3.9.0`.

```bash
git checkout -b release/3.9.0

npm version 3.9.0 --no-git-tag-version
```

Verify:

```bash
node -p "require('./package.json').version"
git diff
```

Run final validation:

```bash
npm test
npm run build
npm pack --dry-run
```

Commit and push:

```bash
git add package.json package-lock.json
git commit -m "Release 3.9.0"

git push -u origin release/3.9.0
```

---

## 4. Merge Release into `main`

Open a pull request:

```text
release/3.9.0 -> main
```

After CI passes, merge the PR.

Then update local `main`:

```bash
git checkout main
git pull --ff-only origin main

git status
node -p "require('./package.json').version"
```

Expected:

```text
3.9.0
```

---

## 5. Tag and Publish

Create the release tag:

```bash
git tag v3.9.0
git push origin v3.9.0
```

Pushing the tag triggers the GitHub Actions release workflow.

The workflow runs:

```text
npm ci
npm test
npm run build
npm pack
npm publish
```

Publication uses npm Trusted Publishing / OIDC.

No `NPM_TOKEN` is required.

---

## 6. Verify npm Release

```bash
npm view astro-viewer version
npm view astro-viewer dist-tags
```

Expected:

```text
3.9.0
```

The npm website may take a short time to display a newly published version.

---

## 7. Return to `dev`

Merge the released `main` back into `dev`:

```bash
git checkout dev
git pull --ff-only origin dev

git merge main
```

Start the next development version:

```bash
npm version 3.10.0-snapshot --no-git-tag-version

git add package.json package-lock.json
git commit -m "Start 3.10.0-snapshot development"

git push origin dev
```

Verify:

```bash
node -p "require('./package.json').version"
git status
```

Expected:

```text
3.10.0-snapshot
```

and:

```text
nothing to commit, working tree clean
```

---

## Release Flow

```text
feature/*
   ↓
  dev
   ↓
release/x.y.z
   ↓
  main
   ↓
 tag vx.y.z
   ↓
GitHub Actions
   ↓
npm publish
   ↓
main -> dev
   ↓
next snapshot
```

## Quick Release Checklist

```bash
# DEV
git checkout dev
git pull --ff-only origin dev
npm test
npm run build
npm pack --dry-run

# RELEASE
git checkout -b release/x.y.z
npm version x.y.z --no-git-tag-version
npm test
npm run build
npm pack --dry-run
git add package.json package-lock.json
git commit -m "Release x.y.z"
git push -u origin release/x.y.z

# PR
# release/x.y.z -> main

# MAIN
git checkout main
git pull --ff-only origin main
git tag vx.y.z
git push origin vx.y.z

# VERIFY
npm view astro-viewer version
npm view astro-viewer dist-tags

# NEXT DEVELOPMENT VERSION
git checkout dev
git pull --ff-only origin dev
git merge main
npm version <next-version>-snapshot --no-git-tag-version
git add package.json package-lock.json
git commit -m "Start <next-version>-snapshot development"
git push origin dev
```