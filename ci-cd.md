# AstroViewer Release Notes

This repository is part of the AstroViewer dependency family and now follows a
dual-license model. Before a commercial-facing release is considered final,
review:

- `LICENSE.md`
- `LICENSE-COMMERCIAL.md`
- `LICENSE-NONCOMMERCIAL.md`
- `DEPENDENCY-LICENSING.md`

## Current release policy

- use the current package name `@fab77/astro-viewer` until the package-channel
  strategy is finalized
- do not introduce a separate commercial npm package name until the legal text
  and package-channel strategy are finalized across the dependency family
- tag releases from `main` with `v<version>`
- use CI build success and a local `npm run build` as the minimum release gate

## Suggested release flow

```bash
git checkout dev
git pull origin dev

git checkout -b release/3.5.0

npm version 3.5.0 --no-git-tag-version
npm install
npm run build

git status
git add package.json package-lock.json README.md LICENSE.md LICENSE-COMMERCIAL.md LICENSE-NONCOMMERCIAL.md DEPENDENCY-LICENSING.md ci-cd.md .github/workflows/ci.yml
git commit -m "Prepare release 3.5.0"

git push -u origin release/3.5.0
```
Open PR `release/3.5.0 -> main` in GitHub and merge on `main`.

From `main`:
```bash
git checkout main
git pull origin main

node -p "require('./package.json').version"
npm ci
npm run build
npm pack --dry-run
find dist lib-esm -name "*.map"

git tag -a v3.5.0 -m "Release v3.5.0"
git push origin v3.5.0
npm publish --registry=https://npm.pkg.github.com

```
## Verify published package
```bash
npm view @fab77/astro-viewer@3.5.0 --registry=https://npm.pkg.github.com
npm info @fab77/astro-viewer --registry=https://npm.pkg.github.com
```

create a tmp directory:

```bash
mkdir /tmp/av-test
cd /tmp/av-test

npm init -y
echo "@fab77:registry=https://npm.pkg.github.com" > .npmrc
npm install @fab77/astro-viewer@3.5.0
node -e "console.log(require('@fab77/astro-viewer/package.json').version)"
```



After release, merge to `dev`:
```bash
git checkout dev
git pull origin dev
git merge main

npm version 3.6.0-snapshot --no-git-tag-version
npm install

git add package.json package-lock.json
git commit -m "Start 3.6.0-snapshot development"
git push origin dev
```
