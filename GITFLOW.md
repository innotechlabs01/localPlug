# Gitflow Workflow

## Branch Strategy

```
main (production)
  ↑
  | PR (after QA approval)
  |
qa (testing/preview)
  ↑
  | PR (after CI passes)
  |
develop (integration)
  ↑
  | PR (feature complete)
  |
feature/* (development)
```

## Branch Purposes

| Branch | Purpose | Deploy | Environment |
|--------|---------|--------|-------------|
| `main` | Production-ready code | Vercel Production | `https://localplug.vercel.app` |
| `qa` | Testing and validation | Vercel Preview | Preview URL (auto-generated) |
| `develop` | Integration branch | CI only (no deploy) | N/A |
| `feature/*` | Feature development | CI only (no deploy) | N/A |

## Workflow

### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Work on feature...
git add .
git commit -m "feat: add my feature"

# Push and create PR to develop
git push -u origin feature/my-feature
# Create PR: feature/my-feature → develop
```

### 2. CI on Develop

When PR to `develop` is created:
- ✅ Lint check
- ✅ TypeScript check
- ✅ Tests
- ✅ Build verification

**No deployment** - CI only

### 3. QA Testing

```bash
# After PR to develop is merged
git checkout qa
git pull origin qa
git merge develop
git push origin qa
```

When code is pushed to `qa`:
- ✅ All CI checks
- ✅ **Deploy preview** to Vercel
- ✅ Preview URL available for testing

### 4. Production Deployment

```bash
# After QA approval
git checkout main
git pull origin main
git merge qa
git push origin main
```

When code is pushed to `main`:
- ✅ All CI checks
- ✅ **Deploy production** to Vercel
- ✅ Live at `https://localplug.vercel.app`

## PR Workflow

### Feature → Develop

1. Create feature branch from `develop`
2. Commit changes
3. Push to remote
4. Create PR: `feature/*` → `develop`
5. CI runs (lint, typecheck, tests, build)
6. Code review required
7. Merge to `develop`

### Develop → QA

1. `develop` is up to date
2. Create PR: `develop` → `qa`
3. CI runs
4. Merge to `qa`
5. **Auto-deploy preview** to Vercel
6. QA team tests on preview URL

### QA → Main

1. QA tests passed
2. Create PR: `qa` → `main`
3. CI runs
4. Code review required
5. Merge to `main`
6. **Auto-deploy production** to Vercel

## Environment Variables

Required in GitHub Secrets:

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel API token for deployment |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

## Testing on QA

After `qa` branch is deployed:
1. Open the preview URL from Vercel
2. Test all features:
   - Booking flow
   - Payment processing
   - WhatsApp integration
   - Admin dashboard
3. Report issues in PR comments
4. Fix issues on feature branch
5. Repeat QA cycle

## Rollback

If production has issues:
1. Revert commit on `main`
2. Push revert
3. Vercel auto-deploys previous version

Or:
1. Create hotfix branch from `main`
2. Fix issue
3. Merge to `main` and `develop`
4. Vercel auto-deploys fix
