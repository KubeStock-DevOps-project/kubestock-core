# ACTION REQUIRED: Complete CI/CD Setup

## ⚡ Quick Start (15 minutes)

Your CI/CD pipeline is **95% complete**! Just need to add GitHub secrets and create environments.

## Step 1: Create GitHub Personal Access Token (5 min)

1. Go to: https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"**
3. Configure:
   - **Token name**: `kubestock-gitops-cicd`
   - **Expiration**: 90 days
   - **Repository access**: Only select → `KubeStock-DevOps-project/kubestock-gitops`
   - **Permissions** → **Repository permissions** → **Contents**: Read and Write
4. Click **"Generate token"**
5. **COPY THE TOKEN** (shown only once!)

## Step 2: Add Secret to All Microservice Repos (5 min)

Replace `YOUR_TOKEN_HERE` and run:

```bash
export GITOPS_TOKEN="ghp_YOUR_TOKEN_HERE"

gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-product --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-inventory --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-supplier --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-order-management --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-identity --body "$GITOPS_TOKEN"
```

**Expected output:**
```
✓ Set Actions secret GITOPS_REPO_TOKEN for KubeStock-DevOps-project/ms-product
✓ Set Actions secret GITOPS_REPO_TOKEN for KubeStock-DevOps-project/ms-inventory
...
```

## Step 3: Create GitHub Environments (5 min)

For **each** of these repos:
- https://github.com/KubeStock-DevOps-project/ms-product/settings/environments
- https://github.com/KubeStock-DevOps-project/ms-inventory/settings/environments
- https://github.com/KubeStock-DevOps-project/ms-supplier/settings/environments
- https://github.com/KubeStock-DevOps-project/ms-order-management/settings/environments
- https://github.com/KubeStock-DevOps-project/ms-identity/settings/environments

**Do this:**
1. Click **"New environment"**
2. Name: `staging`
3. Check ☑️ **"Required reviewers"**
4. Click **"Add up to 6 reviewers"** → Select yourself
5. Click **"Save protection rules"**

## Step 4: Test The Pipeline! (5 min)

```bash
# Make a tiny change to ms-identity
cd /home/ubuntu/kubestock-core/modules/ms-identity
echo "// CI/CD test $(date)" >> src/server.js
git add src/server.js
git commit -m "test: verify CI/CD pipeline"
git push origin HEAD:main
```

**Then:**
1. Go to: https://github.com/KubeStock-DevOps-project/ms-identity/actions
2. Click the running workflow
3. Watch stages 1 & 2 complete automatically
4. When stage 3 shows "Waiting for approval":
   - Click **"Review deployments"**
   - Check ☑️ `staging`
   - Click **"Approve and deploy"**
5. Stage 4 completes
6. Wait 1-3 minutes for ArgoCD to sync
7. Verify: `kubectl get pods -n kubestock-staging -l app=ms-identity`

## ✅ Success Checklist

- [ ] GitHub PAT created and copied
- [ ] GITOPS_REPO_TOKEN added to all 5 microservice repos
- [ ] `staging` environment created in all 5 microservice repos with yourself as reviewer
- [ ] Test deployment completed successfully
- [ ] New pod running with updated code

## 🎯 What Happens After Setup

Every code push to `main` branch of any microservice will:
1. ✅ Build Docker image automatically
2. ✅ Push to ECR with commit SHA tag
3. ✅ Update GitOps repo with new SHA
4. ⏸️ Wait for your approval
5. ✅ ArgoCD auto-deploys to staging (within 3 min)

## 🆘 Need Help?

### Can't install `gh` CLI?
Alternative: Add secrets via GitHub UI:
1. Go to each repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `GITOPS_REPO_TOKEN`
4. Value: (paste your PAT)
5. Click "Add secret"

### Pipeline fails at "Update GitOps"?
**Error:** `Resource not accessible by personal access token`
**Fix:** Check:
- Token has `Contents: Write` permission
- Token scope includes `kubestock-gitops` repo
- Secret name is exactly `GITOPS_REPO_TOKEN`

### Don't see "Review deployments" button?
**Fix:** 
- Verify `staging` environment exists
- Check you're added as a reviewer
- Try refreshing the page

## 📚 Documentation

- **Full guide**: `.github/CI_CD_IMPLEMENTATION_SUMMARY.md`
- **Setup help**: `.github/setup-cicd.md`
- **Original plan**: `.github/prompts/plan-cicdPipelineImplementation.prompt.md`

## 🚀 Ready To Go Live?

Once testing works:
1. Remove the test commit
2. Deploy your real changes
3. Enjoy automated deployments! 🎉

**Estimated Time:** 15 minutes
**Difficulty:** Easy
**Impact:** Massive! 🚀
