# Release Checklist

Use this checklist from a network-enabled shell before publishing.

## 1) Verify local state

```bash
git status --short --branch
npm test
npm run typecheck
NPM_CONFIG_CACHE=/tmp/.npm-cache npm pack --dry-run
```

## 2) Push to GitHub

```bash
git push origin main
```

Optional verification:

```bash
git ls-remote --heads origin main
```

## 3) Confirm npm version state

```bash
npm view @gulla0/cardano-error-normalizer version
node -p "require('./package.json').version"
```

If versions match and you need a new release, bump version first:

```bash
npm version patch
```

## 4) Publish to npm

```bash
NPM_CONFIG_CACHE=/tmp/.npm-cache npm publish --access public
```

If npm prompts for authentication or 2FA, complete the prompt in the same terminal session.

## 5) Post-publish verification

```bash
npm view @gulla0/cardano-error-normalizer version
npm view @gulla0/cardano-error-normalizer dist-tags
npm i @gulla0/cardano-error-normalizer
```
