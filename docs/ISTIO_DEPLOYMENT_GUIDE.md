# Istio Service Mesh Deployment Guide

## Quick Start

### 1. Install Istio

```bash
# Make the script executable
chmod +x infrastructure/install-istio.sh

# Run installation (demo profile includes observability stack)
./infrastructure/install-istio.sh demo

# Or use production profile (lightweight)
./infrastructure/install-istio.sh production
```

### 2. Deploy KubeStock with Istio

```bash
# Apply the base configuration (includes Istio Istio manifests)
kubectl apply -k gitops/base/

# Apply staging overlay with all services
kubectl apply -k gitops/overlays/staging/
```

### 3. Verify Installation

```bash
# Check Istio system pods
kubectl get pods -n istio-system

# Check if sidecars are injected
kubectl get pods -n kubestock-staging -o jsonpath='{.items[*].spec.containers[*].name}'

# Should see: istio-proxy, ms-identity, ms-inventory, etc.
```

## What's Been Configured

### ✅ Enabled Features

1. **Automatic Sidecar Injection**

   - Namespace label: `istio-injection: enabled`
   - Location: `gitops/base/namespaces/staging.yaml`

2. **Strict mTLS (Mutual TLS)**

   - All pod-to-pod communication encrypted
   - Certificate rotation automatic
   - Location: `gitops/base/istio/peer-authentication-strict.yaml`

3. **Per-Service Traffic Management**

   - DestinationRules (mTLS enforcement)
   - VirtualServices (routing & resilience)
   - Retries: 3 attempts, 10s timeout per attempt
   - Request timeout: 30s

4. **Services Configured**
   - ms-identity (port 3006)
   - ms-inventory (port 3001)
   - ms-product (port 3003)
   - ms-supplier (port 3004)
   - ms-order-management (port 3002)
   - frontend (port 3000)

### File Structure Created

```
gitops/
├── base/
│   ├── istio/
│   │   ├── kustomization.yaml
│   │   └── peer-authentication-strict.yaml
│   └── services/
│       ├── ms-identity/
│       │   ├── istio-destinationrule.yaml    (NEW)
│       │   ├── istio-virtualservice.yaml     (NEW)
│       │   ├── kustomization.yaml            (UPDATED)
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       ├── ms-inventory/
│       │   ├── istio-destinationrule.yaml    (NEW)
│       │   ├── istio-virtualservice.yaml     (NEW)
│       │   ├── kustomization.yaml            (UPDATED)
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       ├── ms-product/
│       │   ├── istio-destinationrule.yaml    (NEW)
│       │   ├── istio-virtualservice.yaml     (NEW)
│       │   ├── kustomization.yaml            (UPDATED)
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       ├── ms-supplier/
│       │   ├── istio-destinationrule.yaml    (NEW)
│       │   ├── istio-virtualservice.yaml     (NEW)
│       │   ├── kustomization.yaml            (UPDATED)
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       ├── ms-order-management/
│       │   ├── istio-destinationrule.yaml    (NEW)
│       │   ├── istio-virtualservice.yaml     (NEW)
│       │   ├── kustomization.yaml            (UPDATED)
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       └── frontend/
│           ├── istio-destinationrule.yaml    (NEW)
│           ├── istio-virtualservice.yaml     (NEW)
│           ├── kustomization.yaml            (UPDATED)
│           ├── deployment.yaml
│           └── service.yaml
├── namespaces/
│   ├── staging.yaml                          (UPDATED - added istio-injection label)
│   └── production.yaml
├── base/kustomization.yaml                   (UPDATED - added istio/ reference)
└── overlays/
    └── staging/
        ├── kustomization.yaml
        └── namespace.yaml                    (UPDATED - added istio-injection label)
```

## Testing mTLS

### 1. Verify mTLS is Enforced

```bash
# Check PeerAuthentication policy
kubectl get peerauthentication -n istio-system -o yaml

# Check DestinationRules (should show ISTIO_MUTUAL)
kubectl get destinationrules -n kubestock-staging -o yaml
```

### 2. Test Service-to-Service Communication

```bash
# Deploy a test pod
kubectl run test-pod --image=curlimages/curl -n kubestock-staging -- sleep 1000

# Test connectivity from test pod
kubectl exec test-pod -n kubestock-staging -- curl http://ms-identity:3006/health

# If mTLS is working, connection should succeed
```

### 3. Monitor Traffic (if using demo profile)

```bash
# Open Kiali dashboard
kubectl port-forward -n istio-system svc/kiali 20000:20000

# Open http://localhost:20000 in browser
# Select kubestock-staging namespace to visualize service mesh
```

## Common Tasks

### Add Authorization Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-inventory-access
  namespace: kubestock-staging
spec:
  selector:
    matchLabels:
      app: ms-inventory
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/kubestock-staging/sa/ms-product"]
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/inventory/*"]
```

### Configure Circuit Breaker

Update DestinationRule to add:

```yaml
spec:
  host: ms-inventory
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

### Enable Traffic Mirroring

Update VirtualService to add:

```yaml
spec:
  hosts:
    - ms-product
  http:
    - route:
        - destination:
            host: ms-product
          weight: 90
        - destination:
            host: ms-product-canary
          weight: 10
      mirror:
        host: ms-product-staging
        port:
          number: 3003
```

## Troubleshooting

### Pods not getting sidecars?

```bash
# Check namespace label
kubectl get ns kubestock-staging -o yaml | grep istio

# Re-label if needed
kubectl label namespace kubestock-staging istio-injection=enabled --overwrite

# Restart pods to trigger injection
kubectl rollout restart deployment -n kubestock-staging
```

### Connection refused between services?

```bash
# Check if mTLS is preventing traffic
kubectl exec <pod> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/config_dump | grep -i mtls

# Verify DestinationRules exist
kubectl get destinationrules -n kubestock-staging -o yaml
```

### High latency after mesh deployment?

```bash
# Check sidecar resource usage
kubectl top pods -n kubestock-staging --containers

# Increase resource requests if needed in deployment manifests
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

## Next Steps

1. **Enable Authorization Policies** - Restrict which services can communicate
2. **Configure Rate Limiting** - Add RequestAuthentication + AuthorizationPolicy
3. **Setup Observability** - Use Jaeger/Prometheus/Kiali for monitoring
4. **Enable Fault Injection** - Test service resilience with fault injection
5. **Configure External Integrations** - Add ServiceEntry for external APIs

## References

- Full documentation: `gitops/ISTIO_SERVICE_MESH_SETUP.md`
- [Istio Official Docs](https://istio.io/latest/docs/)
- [Traffic Management](https://istio.io/latest/docs/concepts/traffic-management/)
- [Security & mTLS](https://istio.io/latest/docs/concepts/security/)
