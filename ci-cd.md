# Release branch preparation
```
git checkout dev
git pull origin dev

git checkout -b release/1.3.0

npm version 1.3.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "Prepare release 1.3.0"

git push -u origin release/1.3.0
```
# PR in github for release/1.3.0 -> main and merge to main


# Tag creation
```
git checkout main
git pull origin main
node -p "require('./package.json').version"
```

# NPM publish
```
npm ci
npm publish
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin v1.3.0
```

# Preparation of new snapshot
```
git checkout dev
git pull origin dev
npm version 1.4.0-snapshot --no-git-tag-version
git add package.json package-lock.json
git commit -m "Start 1.4.0-snapshot development"
git push origin dev
```

```
git merge main
```

```
git checkout main
git pull origin main
node -p "require('./package.json').version"
npm ci
npm publish
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin v1.3.0
git checkout dev
```