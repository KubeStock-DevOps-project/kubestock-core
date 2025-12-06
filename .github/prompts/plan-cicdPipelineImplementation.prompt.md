# CI/CD Pipeline Implementation Plan

## Overview

Enhance each microservice's GitHub Actions workflow to implement a complete CI/CD pipeline from build to staging deployment with manual approval gates.

## Current State

- Each microservice has a basic `build-push.yml` workflow that only builds and pushes Docker images to ECR
- Staging environment uses `latest` tag with `imagePullPolicy: Always`
- No automated GitOps updates or deployment verification
- No approval gates before deployment

## Target Architecture

```
┌─────────────────────┐
│  Push to main       │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Job 1: Build & Push │ ← Automatic
│  - Build Docker     │
│  - Push to ECR      │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Job 2: Update GitOps│ ← Automatic
│  - Clone gitops     │
│  - Commit marker    │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Job 3: Approval Gate│ ← MANUAL APPROVAL REQUIRED
│  Environment:staging│
└──────────┬──────────┘
           │
           v (after approval)
┌─────────────────────┐
│ Job 4: Deploy       │ ← Automatic after approval
│  - Dummy echo       │
│  - (Future: kubectl)│
└─────────────────────┘
```

## Implementation Steps

### Step 1: Setup GitHub Environments

For each microservice repository (`ms-product`, `ms-inventory`, `ms-supplier`, `ms-order-management`, `ms-identity`):

1. Navigate to repository → **Settings** → **Environments**
2. Create environment: **`staging`**
   - Enable "Required reviewers"
   - Add team members as reviewers
   - Set wait timer: 0 minutes (can be adjusted)
3. Create environment: **`production`** (for future use)
   - Enable "Required reviewers"
   - Add senior team members as reviewers
   - Set wait timer: 0 minutes

### Step 2: Create GitHub Personal Access Token (PAT)

**Option A: Fine-grained Personal Access Token (Recommended)**
1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click "Generate new token"
3. Configure:
   - **Token name**: `kubestock-gitops-cicd`
   - **Expiration**: 90 days (or organization policy)
   - **Repository access**: Only select `kubestock-gitops`
   - **Repository permissions**:
     - `Contents`: Read and Write
     - `Metadata`: Read (automatically included)
4. Generate token and copy it immediately (shown only once)

**Option B: Classic Personal Access Token**
1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Generate new token with `repo` scope
3. Copy the token

### Step 3: Add Secrets to Microservice Repositories

For each microservice repository (`ms-product`, `ms-inventory`, `ms-supplier`, `ms-order-management`, `ms-identity`):

1. Navigate to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secret:
   - **Name**: `GITOPS_REPO_TOKEN`
   - **Value**: (paste the PAT from Step 2)
4. Click **Add secret**

### Update terraform OIDC to support new environments if not already done.
at /terraform/modules/cicd/main.tf

### Step 4: Update Workflow Files

Replace `.github/workflows/build-push.yml` in each microservice repository with the enhanced workflow below.

**Key Changes to Make Per Service:**
- `ECR_REPOSITORY`: Set to service name (ms-product, ms-inventory, etc.)
- `SERVICE_NAME`: Set to service name (ms-product, ms-inventory, etc.)
- Update the header comment with correct service name

#### Enhanced Workflow Template

```yaml
# =============================================================================
# KubeStock - [SERVICE_NAME] Service
# CI/CD Pipeline: Build, Push & Deploy to Staging
# =============================================================================
# Flow:
# 1. Build & Push to ECR
# 2. Update GitOps repo with new image tag
# 3. Wait for staging approval (manual gate)
# 4. Verify deployment to staging
# =============================================================================

name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: [SERVICE_NAME]  # CHANGE THIS: ms-product, ms-inventory, etc.
  NODE_VERSION: '18'
  GITOPS_REPO: KubeStock-DevOps-project/kubestock-gitops
  SERVICE_NAME: [SERVICE_NAME]  # CHANGE THIS: ms-product, ms-inventory, etc.

permissions:
  id-token: write
  contents: read

jobs:
  # ═══════════════════════════════════════════════════════════════
  # JOB 1: BUILD & PUSH TO ECR
  # ═══════════════════════════════════════════════════════════════
  build-and-push:
    name: Build & Push to ECR
    runs-on: ubuntu-latest

    outputs:
      image_uri: ${{ steps.build-push.outputs.image_uri }}
      image_tag: ${{ steps.build-push.outputs.image_tag }}
      short_sha: ${{ steps.meta.outputs.short_sha }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Extract metadata
        id: meta
        run: |
          SHORT_SHA="${GITHUB_SHA::7}"
          TIMESTAMP=$(date +%Y%m%d%H%M%S)
          echo "short_sha=${SHORT_SHA}" >> $GITHUB_OUTPUT
          echo "timestamp=${TIMESTAMP}" >> $GITHUB_OUTPUT
          echo "full_sha=${GITHUB_SHA}" >> $GITHUB_OUTPUT

      - name: Build and Push Docker image
        id: build-push
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          IMAGE_URI="${REGISTRY}/${{ env.ECR_REPOSITORY }}"
          
          # Build the image
          docker build \
            --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
            --build-arg VCS_REF=${{ github.sha }} \
            --build-arg VERSION=${{ github.ref_name }} \
            -t ${IMAGE_URI}:${{ steps.meta.outputs.full_sha }} \
            -t ${IMAGE_URI}:${{ steps.meta.outputs.short_sha }} \
            -t ${IMAGE_URI}:${{ steps.meta.outputs.timestamp }} \
            -t ${IMAGE_URI}:latest \
            .
          
          # Push all tags
          docker push ${IMAGE_URI}:${{ steps.meta.outputs.full_sha }}
          docker push ${IMAGE_URI}:${{ steps.meta.outputs.short_sha }}
          docker push ${IMAGE_URI}:${{ steps.meta.outputs.timestamp }}
          docker push ${IMAGE_URI}:latest
          
          echo "image_uri=${IMAGE_URI}" >> $GITHUB_OUTPUT
          echo "image_tag=${{ steps.meta.outputs.short_sha }}" >> $GITHUB_OUTPUT

      - name: Build summary
        run: |
          echo "## 🚀 Build & Push Complete" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Property | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|----------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| **Repository** | \`${{ env.ECR_REPOSITORY }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **SHA Tag** | \`${{ steps.meta.outputs.short_sha }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Full SHA** | \`${{ steps.meta.outputs.full_sha }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Timestamp** | \`${{ steps.meta.outputs.timestamp }}\` |" >> $GITHUB_STEP_SUMMARY

  # ═══════════════════════════════════════════════════════════════
  # JOB 2: UPDATE GITOPS REPO FOR STAGING
  # ═══════════════════════════════════════════════════════════════
  update-gitops:
    name: Update GitOps (Staging)
    runs-on: ubuntu-latest
    needs: build-and-push
    
    steps:
      - name: Checkout GitOps repository
        uses: actions/checkout@v4
        with:
          repository: ${{ env.GITOPS_REPO }}
          token: ${{ secrets.GITOPS_REPO_TOKEN }}
          ref: main

      - name: Update staging kustomization with new image tag
        run: |
          cd overlays/staging
          
          # Use kustomize to update image tag
          # Note: This updates to 'latest' tag for staging
          # For production, we would use specific SHA tags
          
          echo "✅ Staging uses 'latest' tag - image already updated by ECR push"
          echo "No kustomization changes needed for staging deployment"
          
          # Optional: Could update to specific SHA tag for better traceability
          # kustomize edit set image \
          #   478468757808.dkr.ecr.ap-south-1.amazonaws.com/${{ env.SERVICE_NAME }}:${{ needs.build-and-push.outputs.short_sha }}

      - name: Commit and push changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          
          # Create a marker commit to trigger ArgoCD sync (if using ArgoCD)
          git commit --allow-empty -m "chore(${{ env.SERVICE_NAME }}): deploy ${{ needs.build-and-push.outputs.short_sha }} to staging
          
          Service: ${{ env.SERVICE_NAME }}
          Image Tag: ${{ needs.build-and-push.outputs.short_sha }}
          Commit: ${{ github.sha }}
          Triggered by: ${{ github.actor }}"
          
          git push origin main

      - name: Summary
        run: |
          echo "## 📝 GitOps Updated" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Staging will automatically pull latest image" >> $GITHUB_STEP_SUMMARY
          echo "- **Service**: ${{ env.SERVICE_NAME }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Image Tag**: \`${{ needs.build-and-push.outputs.short_sha }}\`" >> $GITHUB_STEP_SUMMARY

  # ═══════════════════════════════════════════════════════════════
  # JOB 3: STAGING APPROVAL GATE
  # ═══════════════════════════════════════════════════════════════
  staging-approval:
    name: Approve Staging Deployment
    runs-on: ubuntu-latest
    needs: [build-and-push, update-gitops]
    environment: staging  # Requires manual approval
    
    steps:
      - name: Waiting for approval
        run: |
          echo "## ⏳ Awaiting Staging Approval" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Manual approval required to proceed with staging deployment verification" >> $GITHUB_STEP_SUMMARY
          echo "- **Service**: ${{ env.SERVICE_NAME }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Image Tag**: \`${{ needs.build-and-push.outputs.short_sha }}\`" >> $GITHUB_STEP_SUMMARY

  # ═══════════════════════════════════════════════════════════════
  # JOB 4: VERIFY STAGING DEPLOYMENT
  # ═══════════════════════════════════════════════════════════════
  deploy-staging:
    name: Verify Staging Deployment
    runs-on: ubuntu-latest
    needs: [build-and-push, update-gitops, staging-approval]
    environment: staging
    
    steps:
      - name: Deployment verification (placeholder)
        run: |
          echo "🚀 Deploying ${{ env.SERVICE_NAME }} to staging environment"
          echo "Image: ${{ needs.build-and-push.outputs.image_uri }}:${{ needs.build-and-push.outputs.short_sha }}"
          echo ""
          echo "In a full implementation, this step would:"
          echo "  - Configure kubectl/AWS credentials"
          echo "  - Apply kubectl rollout restart (if using kubectl)"
          echo "  - Trigger ArgoCD sync (if using ArgoCD)"
          echo "  - Wait for rollout completion"
          echo "  - Run health checks"
          echo "  - Run smoke tests"
          
      - name: Deployment summary
        run: |
          echo "## ✅ Staging Deployment Complete" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Property | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|----------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| **Service** | \`${{ env.SERVICE_NAME }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Environment** | \`staging\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Image Tag** | \`${{ needs.build-and-push.outputs.short_sha }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| **Deployed By** | \`${{ github.actor }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Next Steps" >> $GITHUB_STEP_SUMMARY
          echo "- Monitor staging environment" >> $GITHUB_STEP_SUMMARY
          echo "- Run integration tests" >> $GITHUB_STEP_SUMMARY
          echo "- When ready, promote to production" >> $GITHUB_STEP_SUMMARY
```

#### Service-Specific Values

| Service | ECR_REPOSITORY | SERVICE_NAME |
|---------|---------------|--------------|
| Product Catalog | ms-product | ms-product |
| Inventory | ms-inventory | ms-inventory |
| Supplier | ms-supplier | ms-supplier |
| Order Management | ms-order-management | ms-order-management |
| Identity (SCIM2) | ms-identity | ms-identity |

### Step 5: Test the Pipeline

1. Choose one microservice to test first (recommend `ms-identity` as it's simplest)
2. Make a small change (e.g., add a comment in `server.js`)
3. Commit and push to `main` branch
4. Navigate to **Actions** tab in GitHub
5. Observe the pipeline execution:
   - ✅ Job 1 (Build & Push) - completes automatically
   - ✅ Job 2 (Update GitOps) - completes automatically
   - ⏸️ Job 3 (Approval Gate) - waits for manual approval
   - Click **Review deployments** button
   - Select `staging` environment
   - Click **Approve and deploy**
   - ✅ Job 4 (Deploy Verification) - runs after approval

### Step 6: Verify Staging Deployment

Since staging uses `imagePullPolicy: Always` with `latest` tag, the new image will be pulled on next pod restart:

```bash
# Force pull new image
kubectl rollout restart deployment/ms-identity -n kubestock-staging

# Wait for rollout
kubectl rollout status deployment/ms-identity -n kubestock-staging

# Verify pods
kubectl get pods -n kubestock-staging -l app=ms-identity

# Check logs
kubectl logs -l app=ms-identity -n kubestock-staging --tail=20
```

### Step 7: Roll Out to Other Services

Once tested successfully with one service, repeat Step 4 for remaining microservices:
- `ms-product`
- `ms-inventory`
- `ms-supplier`
- `ms-order-management`

## How the Pipeline Works

### Job 1: Build & Push
- Builds Docker image with multiple tags (SHA, timestamp, latest)
- Pushes all tags to AWS ECR
- Outputs image URI and tag for downstream jobs

### Job 2: Update GitOps
- Clones the `kubestock-gitops` repository
- Creates an empty commit with deployment metadata
- This serves as an audit trail and can trigger ArgoCD sync
- For staging, uses `latest` tag (no kustomization change needed)
- For production (future), would update kustomization with specific SHA tag

### Job 3: Approval Gate
- Uses GitHub Environments feature
- Pauses pipeline execution
- Sends notification to configured reviewers
- Requires manual approval to proceed
- Provides deployment summary for review

### Job 4: Deploy Verification
- Currently a placeholder with echo statements
- Documents what a full implementation would do
- Can be enhanced later with actual kubectl commands

## Current Deployment Mechanism

Since staging uses:
```yaml
images:
  - name: 478468757808.dkr.ecr.ap-south-1.amazonaws.com/ms-identity
    newTag: latest
```

And pods have:
```yaml
imagePullPolicy: Always
```

The deployment happens automatically when pods restart and pull the new `latest` image from ECR.

## Future Enhancements

### Phase 2: Automated Deployment Verification

Add to Job 4:

```yaml
- name: Configure kubectl
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_OIDC_ROLE_ARN }}
    aws-region: ap-south-1

- name: Update kubeconfig
  run: |
    aws eks update-kubeconfig --region ap-south-1 --name kubestock-cluster

- name: Restart deployment
  run: |
    kubectl rollout restart deployment/${{ env.SERVICE_NAME }} -n kubestock-staging
    kubectl rollout status deployment/${{ env.SERVICE_NAME }} -n kubestock-staging --timeout=5m

- name: Run health checks
  run: |
    kubectl wait --for=condition=ready pod \
      -l app=${{ env.SERVICE_NAME }} \
      -n kubestock-staging \
      --timeout=5m

- name: Run smoke tests
  run: |
    ENDPOINT=$(kubectl get svc ${{ env.SERVICE_NAME }} -n kubestock-staging -o jsonpath='{.spec.clusterIP}')
    curl -f http://${ENDPOINT}:${{ env.PORT }}/health
```

### Phase 3: Production Deployment

Add production workflow with:
- Specific SHA tags (not `latest`)
- Blue-green or canary deployment strategy
- Stricter approval requirements
- Automated rollback on failure
- Integration test suite

### Phase 4: ArgoCD Integration

If implementing ArgoCD:
- Remove manual kubectl commands
- Let ArgoCD detect GitOps repo changes
- Add ArgoCD sync wait step
- Monitor sync status via ArgoCD API

## Security Considerations

### GitHub PAT
- Use fine-grained tokens with minimal permissions
- Scope to only `kubestock-gitops` repository
- Set reasonable expiration (90 days)
- Rotate regularly
- Store as encrypted secret in GitHub Actions

### AWS Credentials
- Use OIDC (OpenID Connect) for keyless authentication
- IAM role with minimal permissions
- No long-lived AWS access keys

### Approval Gates
- Require multiple reviewers for production
- Set up CODEOWNERS for automatic reviewer assignment
- Enable branch protection rules
- Audit deployment history via Git commits

## Troubleshooting

### "Resource not accessible by personal access token"
- Verify PAT has `Contents: Write` permission
- Check token hasn't expired
- Ensure token scope includes `kubestock-gitops` repo

### "Environment protection rule failure"
- Verify `staging` environment exists in repository
- Check you're added as a reviewer
- Ensure environment protection rules are properly configured

### "docker push failed"
- Verify AWS OIDC role ARN is correct in secrets
- Check IAM role has ECR push permissions
- Ensure ECR repository exists

### Pipeline stuck on approval
- Check email/GitHub notifications
- Go to Actions tab → Click on workflow run → "Review deployments" button
- Approve and deploy

## Success Metrics

After implementation, you should have:
- ✅ 5 microservices with enhanced CI/CD pipelines
- ✅ Automated build and push to ECR
- ✅ GitOps repo automatically updated with deployment metadata
- ✅ Manual approval gate before staging deployment
- ✅ Audit trail of all deployments via Git history
- ✅ Foundation for production deployment pipeline

## Timeline

- **Step 1-3** (Setup): 30 minutes
- **Step 4** (First service): 45 minutes
- **Step 5** (Testing): 15 minutes
- **Step 6** (Verification): 10 minutes
- **Step 7** (Rollout): 1 hour

**Total estimated time**: ~3 hours

## Next Steps After Implementation

1. Monitor pipeline executions for a few days
2. Gather feedback from team on approval process
3. Implement Phase 2 (automated deployment verification)
4. Design production deployment strategy
5. Set up monitoring and alerting for deployments
6. Document runbook for deployment failures
