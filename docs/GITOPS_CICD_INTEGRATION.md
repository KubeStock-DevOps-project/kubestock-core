# GitOps CI/CD Integration

## Overview

The CI/CD pipeline has been enhanced with GitOps principles, integrating seamlessly with ArgoCD for automated deployments.

## How It Works

### Traditional CI/CD (Before)
```
GitHub → Build → Push Image → kubectl apply → K8s Cluster
```

### GitOps CI/CD (Now)
```
GitHub → Build → Push Image → Update Git Manifests → ArgoCD Detects → K8s Cluster
                                      ↑
                                  (Stage 4)
```

## Stage 4: GitOps Update

**Previous Behavior:**
- Directly applied changes using `kubectl`
- Required cluster credentials in CI/CD
- Manual deployment process

**New Behavior:**
- Updates image tags in `k8s/base/services/*/deployment.yaml`
- Commits changes back to Git repository
- ArgoCD detects changes automatically
- Deploys via GitOps (auto-sync enabled for staging)

### What Happens in Stage 4

1. **Checkout Repository**
   - Fetches latest code with write permissions

2. **Update Manifests**
   - Updates all service deployment files with new image tags
   - Tag format: `sha-<commit-hash>`
   
3. **Commit Changes**
   - Creates automated commit with image tag updates
   - Message includes service list and trigger info

4. **Push to Repository**
   - Pushes changes to same branch
   - Triggers ArgoCD change detection

5. **ArgoCD Deployment**
   - ArgoCD detects manifest changes (polling every 3 minutes)
   - Auto-syncs staging environment
   - Production requires manual approval

## Benefits

### 1. **Declarative Infrastructure**
- Git is single source of truth
- All changes tracked in version control
- Easy rollback via Git revert

### 2. **Audit Trail**
- Every deployment creates Git commit
- Full history of what was deployed when
- Compliance-friendly

### 3. **Security**
- No cluster credentials in CI/CD
- ArgoCD handles authentication
- Reduced attack surface

### 4. **Separation of Concerns**
- CI/CD builds and tests
- ArgoCD handles deployment
- Clear responsibility boundaries

### 5. **Consistency**
- Same deployment process everywhere
- Manual and automated deploys use same path
- Reduces configuration drift

## Configuration

### GitHub Actions Workflow

**File:** `.github/workflows/ci-cd-staging.yml`

**Key Changes:**
```yaml
stage-4-deploy-staging:
  permissions:
    contents: write  # Required to push changes
  
  steps:
    - name: Update image tags
      run: |
        sed -i "s|image: .*/user-service:.*|image: ghcr.io/.../user-service:sha-${{ github.sha }}|g" \
          k8s/base/services/user-service/deployment.yaml
    
    - name: Commit and push
      run: |
        git add k8s/base/services/*/deployment.yaml
        git commit -m "chore: update image tags"
        git push origin HEAD:${{ github.ref_name }}
```

### ArgoCD Application

**File:** `k8s/argocd/applications/inventory-system-staging.yaml`

**Sync Policy:**
```yaml
syncPolicy:
  automated:
    prune: true      # Delete resources not in Git
    selfHeal: true   # Revert manual changes
    allowEmpty: false
  syncOptions:
    - CreateNamespace=true
  retry:
    limit: 5
    backoff:
      duration: 5s
```

## Deployment Flow

### Staging Environment (Auto-Sync)

```
1. Developer pushes code
   ↓
2. CI/CD builds image
   ↓
3. Image pushed to registry
   ↓
4. CI/CD updates K8s manifests in Git
   ↓
5. ArgoCD detects change (within 3 minutes)
   ↓
6. ArgoCD syncs staging automatically
   ↓
7. New version deployed
```

**Timeline:**
- Build & push: ~2-3 minutes
- Manifest update: ~30 seconds
- ArgoCD detection: ~0-3 minutes
- Deployment: ~1-2 minutes
- **Total: 3-8 minutes**

### Production Environment (Manual Sync)

```
1-4. Same as staging
   ↓
5. ArgoCD detects change
   ↓
6. Manual approval required
   ↓
7. Operator clicks "Sync" in ArgoCD UI
   ↓
8. Production deployed
```

## Monitoring Deployment

### Via ArgoCD UI

```bash
# Port-forward ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access UI
https://localhost:8080
# Login: admin / <password from install>
```

### Via kubectl

```bash
# Check application status
kubectl get applications -n argocd

# Describe application
kubectl describe application inventory-system-staging -n argocd

# Watch deployment progress
kubectl get pods -n inventory-system -w
```

### Via ArgoCD CLI

```bash
# Install CLI
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd
sudo mv argocd /usr/local/bin/

# Login
argocd login localhost:8080

# Check app status
argocd app get inventory-system-staging

# View sync history
argocd app history inventory-system-staging

# Manual sync production
argocd app sync inventory-system-production
```

## Rollback Procedure

### Via Git (Recommended)

```bash
# Revert to previous commit
git revert HEAD
git push

# ArgoCD will auto-deploy previous version
```

### Via ArgoCD UI

1. Go to application in ArgoCD UI
2. Click "History and Rollback"
3. Select previous revision
4. Click "Rollback"

### Via ArgoCD CLI

```bash
# View history
argocd app history inventory-system-staging

# Rollback to specific revision
argocd app rollback inventory-system-staging <revision-id>
```

## Troubleshooting

### Changes Not Deploying

**Problem:** Manifest updated but ArgoCD not syncing

**Solutions:**

1. **Check sync policy**
   ```bash
   kubectl get application inventory-system-staging -n argocd -o yaml | grep -A 10 syncPolicy
   ```

2. **Force refresh**
   ```bash
   argocd app get inventory-system-staging --refresh
   ```

3. **Manual sync**
   ```bash
   argocd app sync inventory-system-staging
   ```

4. **Check ArgoCD logs**
   ```bash
   kubectl logs -n argocd deployment/argocd-application-controller
   ```

### Manifest Update Failed

**Problem:** CI/CD cannot push to Git

**Solutions:**

1. **Check permissions**
   - Ensure `contents: write` in workflow
   - Verify `GITHUB_TOKEN` has push access

2. **Check branch protection**
   - May need to disable branch protection
   - Or use deploy key with bypass

3. **Manual merge conflicts**
   ```bash
   # If CI created orphan commits
   git fetch origin
   git merge origin/main
   git push
   ```

### Image Not Updating

**Problem:** New image pushed but pods not restarting

**Solutions:**

1. **Verify image tag in manifest**
   ```bash
   cat k8s/base/services/user-service/deployment.yaml | grep image:
   ```

2. **Check ArgoCD sync status**
   ```bash
   argocd app get inventory-system-staging
   ```

3. **Force pod restart**
   ```bash
   kubectl rollout restart deployment/user-service -n inventory-system
   ```

## Best Practices

### 1. **Small, Frequent Commits**
- Easier to rollback
- Faster feedback
- Less risky

### 2. **Meaningful Commit Messages**
- Include service names
- Reference issue/PR numbers
- Note breaking changes

### 3. **Monitor Deployments**
- Watch ArgoCD sync status
- Check application health
- Review metrics after deploy

### 4. **Test in Staging First**
- Auto-sync staging
- Manual production
- Verify before promoting

### 5. **Use Image Digests (Advanced)**
```yaml
image: ghcr.io/org/service@sha256:abc123...
```
- Immutable references
- Guaranteed reproducibility
- Prevents tag mutation

## Integration with Other Tools

### Prometheus Alerts

Monitor ArgoCD sync status:
```yaml
- alert: ArgoAppSyncFailed
  expr: argocd_app_sync_status{sync_status!="Synced"} == 1
  for: 10m
  annotations:
    summary: "ArgoCD app {{ $labels.name }} sync failed"
```

### Slack Notifications

ArgoCD webhook for Slack:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
  trigger.on-sync-succeeded: |
    - send: [slack-success]
```

### GitOps Dashboard

Monitor all deployments:
```bash
# Install Argo CD Dashboard
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

## Security Considerations

### 1. **Secrets Management**
- Don't commit secrets to Git
- Use Sealed Secrets or External Secrets Operator
- Example:
  ```bash
  kubectl create secret generic db-password \
    --from-literal=password=secret \
    --dry-run=client -o yaml | \
    kubeseal -o yaml > sealed-secret.yaml
  ```

### 2. **RBAC**
- Limit who can sync production
- Use ArgoCD projects for isolation
- Implement approval workflows

### 3. **Image Verification**
- Sign images with cosign
- Verify signatures in admission webhook
- Use only trusted registries

### 4. **Branch Protection**
- Require PR reviews
- Enforce status checks
- Prevent force pushes

## Advanced: Multi-Environment Promotion

### Using Branches

```
main → staging (auto-sync)
production → production (manual sync)
```

### Using Kustomize Overlays

```
base/
  ├── deployment.yaml (with image placeholders)
overlays/
  ├── staging/
  │   └── kustomization.yaml (staging values)
  └── production/
      └── kustomization.yaml (production values)
```

### Using Helm Values

```yaml
# staging-values.yaml
image:
  tag: sha-abc123

# production-values.yaml  
image:
  tag: sha-xyz789
```

## Comparison: GitOps vs Traditional

| Aspect | Traditional CI/CD | GitOps CI/CD |
|--------|------------------|--------------|
| **Deployment** | kubectl apply | Git commit |
| **Credentials** | In CI/CD | In cluster |
| **Audit Trail** | CI/CD logs | Git history |
| **Rollback** | Re-run pipeline | Git revert |
| **Drift Detection** | Manual | Automatic |
| **Approval** | Custom gates | Git PR |
| **Speed** | Immediate | 0-3 min delay |
| **Complexity** | Lower | Higher |
| **Scalability** | Limited | Excellent |

## Conclusion

GitOps integration provides:
- ✅ Better security
- ✅ Complete audit trail
- ✅ Easy rollbacks
- ✅ Automated drift detection
- ✅ Scalable multi-cluster deployments

The slight delay (0-3 minutes) for ArgoCD change detection is acceptable for the benefits gained.

## References

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitOps Principles](https://opengitops.dev/)
- [Kubernetes GitOps Best Practices](https://kubernetes.io/docs/concepts/overview/working-with-objects/declarative-config/)
