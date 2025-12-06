# CI/CD Pipeline Setup Instructions

## Step 1: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Configure:
   - **Token name**: `kubestock-gitops-cicd`
   - **Expiration**: 90 days
   - **Repository access**: Only select `kubestock-gitops`
   - **Permissions**: 
     - Contents: Read and Write
4. Click "Generate token"
5. **COPY THE TOKEN** (shown only once)

## Step 2: Add Secret to Microservice Repositories

Run this for each microservice repository:

```bash
# Set your PAT
export GITOPS_TOKEN="ghp_your_token_here"

# Add to each microservice repo
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-product --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-inventory --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-supplier --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-order-management --body "$GITOPS_TOKEN"
gh secret set GITOPS_REPO_TOKEN --repo KubeStock-DevOps-project/ms-identity --body "$GITOPS_TOKEN"
```

## Step 3: Create GitHub Environments

For each microservice repository, create the `staging` environment:

```bash
# Using GitHub CLI
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/KubeStock-DevOps-project/ms-product/environments/staging \
  -f "wait_timer=0" \
  -f "prevent_self_review=false" \
  -F "reviewers[][type]=User" \
  -F "reviewers[][id]=YOUR_GITHUB_USER_ID"

# Repeat for other repos:
# ms-inventory, ms-supplier, ms-order-management, ms-identity
```

Or do it manually:
1. Go to each repo → Settings → Environments
2. Click "New environment"
3. Name: `staging`
4. Add reviewers: (yourself)
5. Save

## Next Steps

After completing Steps 1-3 above, the automated scripts will:
- Update all workflow files
- Update GitOps configurations to use SHA tags
- Configure ArgoCD auto-sync
