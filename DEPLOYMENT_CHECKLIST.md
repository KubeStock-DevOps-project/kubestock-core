# KubeStock Istio Deployment Checklist

## ✅ Pre-Deployment Verification

### System Requirements

- [ ] Kubernetes cluster version 1.19+
- [ ] kubectl configured and accessible
- [ ] istioctl available locally (install script provides it)
- [ ] ~2 CPU cores, 4GB RAM available for control plane
- [ ] ~100MB RAM per pod for sidecars

### Cluster Readiness

- [ ] Cluster connectivity verified: `kubectl cluster-info`
- [ ] Nodes are ready: `kubectl get nodes`
- [ ] DNS working: `kubectl run -it --rm debug --image=busybox -- nslookup kubernetes.default`
- [ ] Sufficient resources: `kubectl top nodes`

### Network Verification

- [ ] Outbound internet access (for downloading Istio)
- [ ] Can reach Docker registries (ECR, Docker Hub)
- [ ] No egress filters blocking Istio components

---

## 🔧 Installation Phase

### Step 1: Prepare Installation Script

```bash
# [ ] Make script executable
chmod +x infrastructure/install-istio.sh

# [ ] Verify script is readable
file infrastructure/install-istio.sh
```

### Step 2: Install Istio

```bash
# [ ] Choose profile: demo (with observability) or production (lightweight)
./infrastructure/install-istio.sh demo

# [ ] Wait for installation to complete (3-5 minutes)
# [ ] Script will show completion status
```

### Step 3: Verify Istio Installation

```bash
# [ ] Check Istio system namespace
kubectl get namespace istio-system

# [ ] Check all system pods
kubectl get pods -n istio-system

# [ ] Wait for istiod pod to be Running:
kubectl wait --for=condition=Ready pod -l app=istiod -n istio-system --timeout=300s

# [ ] Verify CRDs installed (should see 50+ resources)
kubectl api-resources | grep istio | wc -l
```

### Step 4: Run Installation Verification

```bash
# [ ] Run Istio's verification tool
istioctl verify-install

# [ ] Run analysis for issues
istioctl analyze
```

---

## 📦 Configuration Deployment Phase

### Step 5: Deploy Base Configuration

```bash
# [ ] Navigate to project root
cd c:\Users\rabhi\Documents\kubestock-core

# [ ] Apply base configurations (includes Istio manifests)
kubectl apply -k gitops/base/

# [ ] Verify namespace was created
kubectl get namespace kubestock-staging

# [ ] Check namespace label
kubectl get namespace kubestock-staging -o jsonpath='{.metadata.labels.istio-injection}'
# Should output: enabled
```

### Step 6: Deploy Staging Overlay

```bash
# [ ] Apply staging overlay with all services
kubectl apply -k gitops/overlays/staging/

# [ ] Wait for all pods to be created (1-2 minutes)
kubectl get pods -n kubestock-staging -w

# [ ] Wait for all pods to be Running
kubectl wait --for=condition=Ready pod --all -n kubestock-staging --timeout=300s
```

---

## ✔️ Verification Phase

### Step 7: Verify Sidecar Injection

```bash
# [ ] Check that Envoy sidecars are injected
kubectl get pods -n kubestock-staging -o jsonpath='{.items[*].spec.containers[*].name}' | grep -o "istio-proxy"
# Should see: istio-proxy (multiple times)

# [ ] Detailed pod information
kubectl get pods -n kubestock-staging -o wide

# [ ] Check specific pod has sidecar
kubectl get pod <pod-name> -n kubestock-staging -o yaml | grep -A2 "containers:"
# Should see both app container and istio-proxy

# [ ] Verify sidecar is running
kubectl get pods -n kubestock-staging -o jsonpath='{.items[0].spec.containers[*].name}'
```

### Step 8: Verify Istio Resources

```bash
# [ ] Check PeerAuthentication (mTLS policy)
kubectl get peerauthentication -n istio-system
# Should see: default with mode STRICT

# [ ] Check DestinationRules (mTLS per service)
kubectl get destinationrules -n kubestock-staging
# Should see 6 DestinationRules (one per service)

# [ ] Check VirtualServices (traffic routing)
kubectl get virtualservices -n kubestock-staging
# Should see 6 VirtualServices (one per service)

# [ ] Verify ISTIO_MUTUAL is enforced
kubectl get dr -n kubestock-staging -o yaml | grep -A2 "tls:"
# Should see: mode: ISTIO_MUTUAL
```

### Step 9: Check Namespace Labels

```bash
# [ ] Verify sidecar injection label
kubectl describe namespace kubestock-staging
# Should see: istio-injection=enabled

# [ ] Alternative check
kubectl get ns kubestock-staging --show-labels
# Should include: istio-injection=enabled
```

### Step 10: Verify Resource Creation

```bash
# [ ] Check services
kubectl get svc -n kubestock-staging
# Should see all 6 services

# [ ] Check deployments
kubectl get deploy -n kubestock-staging
# Should see all 6 deployments

# [ ] Check for any pod errors
kubectl get pods -n kubestock-staging
# All should be Running

# [ ] Check events for errors
kubectl get events -n kubestock-staging --sort-by='.lastTimestamp'
```

---

## 🧪 Testing & Validation Phase

### Step 11: Test Service-to-Service Connectivity

```bash
# [ ] Get a pod name to test from
POD=$(kubectl get pod -n kubestock-staging -o jsonpath='{.items[0].metadata.name}')

# [ ] Test connectivity with curl
kubectl exec $POD -n kubestock-staging -- curl http://ms-identity:3006/health
# Should succeed (200 OK or similar)

# [ ] Test from different service
kubectl exec $POD -n kubestock-staging -- curl http://ms-inventory:3001/health
# Should succeed
```

### Step 12: Verify mTLS is Enforced

```bash
# [ ] Check sidecar configuration for mTLS
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/config_dump | grep -i "mtls\|ISTIO_MUTUAL"
# Should see ISTIO_MUTUAL references

# [ ] Verify cluster configuration
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/clusters | head -20
# Should see cluster configuration

# [ ] Check Envoy listeners
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/listeners
# Should show 15000, 15001, and other Envoy listeners
```

### Step 13: Check Sidecar Logs

```bash
# [ ] Get pod name
POD=$(kubectl get pod -n kubestock-staging -o jsonpath='{.items[0].metadata.name}')

# [ ] Check sidecar logs
kubectl logs $POD -n kubestock-staging -c istio-proxy | tail -20
# Should see Envoy startup logs, no errors

# [ ] Check for mTLS startup messages
kubectl logs $POD -n kubestock-staging -c istio-proxy | grep -i tls

# [ ] Get recent warnings/errors
kubectl logs $POD -n kubestock-staging -c istio-proxy | grep -i "warn\|error" | head -5
```

### Step 14: Deploy Test Pod for Extended Testing

```bash
# [ ] Create test pod
kubectl run test-curl --image=curlimages/curl -n kubestock-staging -- sleep 1000

# [ ] Wait for test pod to be ready
kubectl wait --for=condition=Ready pod/test-curl -n kubestock-staging --timeout=60s

# [ ] Test from test pod
kubectl exec test-curl -n kubestock-staging -- curl http://ms-identity:3006/health

# [ ] Test connectivity to multiple services
kubectl exec test-curl -n kubestock-staging -- curl http://ms-inventory:3001/health
kubectl exec test-curl -n kubestock-staging -- curl http://ms-product:3003/health

# [ ] Check test pod has sidecar
kubectl get pod test-curl -n kubestock-staging -o jsonpath='{.spec.containers[*].name}'
# Should see: curl and istio-proxy
```

---

## 📊 Observability Phase (Demo Profile Only)

### Step 15: Access Observability Tools (if using demo profile)

```bash
# [ ] Check if Kiali is running
kubectl get pods -n istio-system | grep kiali

# [ ] Port forward to Kiali
kubectl port-forward -n istio-system svc/kiali 20000:20000 &

# [ ] Access Kiali
# Open browser: http://localhost:20000
# [ ] Select namespace: kubestock-staging
# [ ] Visualize service mesh

# [ ] Check if Jaeger is running
kubectl get pods -n istio-system | grep jaeger

# [ ] Port forward to Jaeger
kubectl port-forward -n istio-system svc/jaeger-collector 16686:16686 &

# [ ] Access Jaeger
# Open browser: http://localhost:16686
# [ ] View traces of service communication

# [ ] Check if Prometheus is running
kubectl get pods -n istio-system | grep prometheus

# [ ] Port forward to Prometheus
kubectl port-forward -n istio-system svc/prometheus 9090:9090 &

# [ ] Access Prometheus
# Open browser: http://localhost:9090
# [ ] Query metrics like: istio_requests_total
```

---

## 🔍 Advanced Verification

### Step 16: Run Istio Analysis

```bash
# [ ] Analyze cluster for Istio issues
istioctl analyze -n kubestock-staging

# [ ] Should show no errors or warnings
# [ ] If issues found, note them for resolution

# [ ] Check specific service
istioctl analyze --namespace kubestock-staging

# [ ] Validate configuration syntax
istioctl validate -f gitops/base/istio/peer-authentication-strict.yaml
```

### Step 17: Monitor Resource Usage

```bash
# [ ] Check resource usage including sidecars
kubectl top pods -n kubestock-staging --containers

# [ ] Check sidecar memory usage (~50-100MB each)
kubectl top pods -n kubestock-staging --containers | grep istio-proxy

# [ ] Check node resources
kubectl top nodes

# [ ] Verify sufficient resources available
```

### Step 18: Check for Connectivity Issues

```bash
# [ ] Test DNS resolution
kubectl exec <pod> -n kubestock-staging -- nslookup ms-identity
# Should resolve to service IP

# [ ] Test service discovery
kubectl exec <pod> -n kubestock-staging -- nslookup ms-identity.kubestock-staging
# Should resolve properly

# [ ] Test from pod to pod
kubectl exec <pod1> -n kubestock-staging -- curl -v http://<pod2>:3006
# Should complete without DNS resolution errors
```

---

## 🛠️ Troubleshooting Phase

### If Sidecars Not Injecting

```bash
# [ ] Check namespace label
kubectl get ns kubestock-staging --show-labels

# [ ] Re-label namespace if needed
kubectl label namespace kubestock-staging istio-injection=enabled --overwrite

# [ ] Restart pods to trigger injection
kubectl rollout restart deploy -n kubestock-staging

# [ ] Wait for new pods
kubectl wait --for=condition=Ready pod --all -n kubestock-staging --timeout=300s

# [ ] Verify new pods have sidecars
kubectl get pods -n kubestock-staging -o jsonpath='{.items[*].spec.containers[*].name}'
```

### If Connections Failing

```bash
# [ ] Check PeerAuthentication mode
kubectl get peerauthentication -n istio-system -o yaml

# [ ] Check DestinationRules
kubectl get destinationrules -n kubestock-staging -o yaml | grep -A3 "tls:"

# [ ] Check VirtualServices
kubectl get virtualservices -n kubestock-staging -o yaml

# [ ] Check sidecar proxy configuration
kubectl exec <pod> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/config_dump | grep "<host>"
```

### If High Latency

```bash
# [ ] Check sidecar resource limits
kubectl get deployment -n kubestock-staging -o yaml | grep -A5 "resources:"

# [ ] Monitor sidecar CPU/memory
kubectl top pods -n kubestock-staging --containers | grep istio-proxy

# [ ] Check for pod evictions
kubectl describe nodes | grep -i "memory\|evicted"
```

---

## ✅ Post-Deployment Validation

### Final Checklist

- [ ] All pods Running with sidecars (6 service + 1 test = 7 pods)
- [ ] All services accessible (HTTP 200 from service to service)
- [ ] mTLS enforced (ISTIO_MUTUAL in config)
- [ ] PeerAuthentication configured (STRICT mode)
- [ ] DestinationRules created for all services
- [ ] VirtualServices configured with retries/timeouts
- [ ] Namespace labeled for sidecar injection
- [ ] No error logs in sidecars
- [ ] Resource usage within expectations
- [ ] Observability tools accessible (if demo profile)

### Success Criteria

✅ **All the following must be true:**

- Sidecars are injected in all pods
- Service-to-service communication works
- mTLS is enforced between pods
- Certificates are properly configured
- No error messages in logs
- Resource usage is acceptable
- Observability is accessible

---

## 📝 Documentation References

For more information on specific steps:

- **Installation details:** See `docs/ISTIO_DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** See `gitops/ISTIO_SERVICE_MESH_SETUP.md#troubleshooting`
- **Commands reference:** See `ISTIO_QUICK_REFERENCE.sh`
- **Architecture details:** See `gitops/ISTIO_SERVICE_MESH_SETUP.md`

---

## 🎯 Quick Troubleshooting Reference

| Issue                  | Check              | Fix                                                                      |
| ---------------------- | ------------------ | ------------------------------------------------------------------------ |
| Sidecars not injecting | Namespace label    | `kubectl label ns kubestock-staging istio-injection=enabled --overwrite` |
| Connection refused     | PeerAuthentication | Check STRICT mode is applied                                             |
| High latency           | Sidecar resources  | Check memory/CPU limits                                                  |
| DNS resolution fails   | Service discovery  | Check service names match                                                |
| No traces in Jaeger    | Demo profile       | Must use `demo` profile for observability                                |

---

## 🎬 Next Actions

After this checklist passes:

1. **Monitor in Production** → Use Kiali/Jaeger for ongoing monitoring
2. **Add Authorization Policies** → Restrict service communication
3. **Enable Rate Limiting** → Protect against abuse
4. **Setup Alerting** → Alert on high error rates
5. **Document Custom Policies** → For your specific use cases

---

**Deployment Checklist Status:**

- ⏳ **Before Installation:** Verify all pre-checks
- 🔧 **During Installation:** Follow installation phase
- ✅ **After Deployment:** Complete verification phase
- 🎯 **Success:** All checks pass

**Estimated Time:** 20-30 minutes from start to full verification

---

_Last Updated: December 7, 2025_
_Project: KubeStock_
_Istio Version: 1.18.0+_
