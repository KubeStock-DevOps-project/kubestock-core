#!/bin/bash
# KubeStock Istio Quick Reference Commands
# Copy and paste these commands for common Istio operations

# ========================================
# INSTALLATION & SETUP
# ========================================

# Install Istio (demo profile with observability)
./infrastructure/install-istio.sh demo

# Or install with production profile (lightweight)
./infrastructure/install-istio.sh production

# Deploy base configuration
kubectl apply -k gitops/base/

# Deploy staging overlay with all services
kubectl apply -k gitops/overlays/staging/

# ========================================
# VERIFICATION & DIAGNOSTICS
# ========================================

# Check Istio system pods
kubectl get pods -n istio-system

# Check Istio installation
istioctl verify-install

# List all Istio resources
kubectl api-resources | grep istio

# Check namespace sidecar injection label
kubectl get ns kubestock-staging --show-labels

# List all sidecars in staging namespace
kubectl get pods -n kubestock-staging -o jsonpath='{.items[*].spec.containers[*].name}'

# Get detailed pod info (including sidecars)
kubectl get pods -n kubestock-staging -o wide

# ========================================
# mTLS VERIFICATION
# ========================================

# Check PeerAuthentication policy (mTLS enforcement)
kubectl get peerauthentication -n istio-system -o yaml

# Check DestinationRules (mTLS per service)
kubectl get destinationrules -n kubestock-staging -o yaml

# Check if specific service has mTLS enabled
kubectl get dr -n kubestock-staging ms-identity -o yaml

# Verify mTLS mode in sidecar config
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/config_dump | grep -i "mtls\|ISTIO_MUTUAL"

# ========================================
# SERVICE CONNECTIVITY TESTING
# ========================================

# Test service-to-service communication
kubectl exec <source-pod> -n kubestock-staging -- \
  curl http://ms-identity:3006/health

# Deploy test pod for connectivity testing
kubectl run test-curl --image=curlimages/curl -n kubestock-staging -- sleep 1000

# Test from test pod to service
kubectl exec test-curl -n kubestock-staging -- curl http://ms-identity:3006/health

# Check service endpoints
kubectl get endpoints -n kubestock-staging

# ========================================
# TRAFFIC MANAGEMENT
# ========================================

# List all VirtualServices
kubectl get virtualservices -n kubestock-staging

# List all DestinationRules
kubectl get destinationrules -n kubestock-staging

# Watch VirtualService traffic distribution
kubectl get vs -n kubestock-staging -o wide -w

# ========================================
# LOGGING & DEBUGGING
# ========================================

# Check sidecar logs for a pod
kubectl logs <pod-name> -n kubestock-staging -c istio-proxy

# Follow sidecar logs in real-time
kubectl logs -f <pod-name> -n kubestock-staging -c istio-proxy

# Check application container logs
kubectl logs <pod-name> -n kubestock-staging -c <app-container>

# Get sidecar access logs
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  tail -100 /var/log/pods/kubestock-staging_<pod-name>/istio-proxy/0.log

# ========================================
# SIDECAR CONFIGURATION INSPECTION
# ========================================

# Dump complete sidecar configuration
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/config_dump > config_dump.json

# Check sidecar listeners (port configuration)
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/listeners | jq .

# Check sidecar clusters (service discovery)
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/clusters | head -50

# Check sidecar routes
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/routes

# ========================================
# OBSERVABILITY (DEMO PROFILE)
# ========================================

# Access Kiali (service mesh visualization)
kubectl port-forward -n istio-system svc/kiali 20000:20000
# Open: http://localhost:20000

# Access Jaeger (distributed tracing)
kubectl port-forward -n istio-system svc/jaeger-collector 16686:16686
# Open: http://localhost:16686

# Access Prometheus metrics
kubectl port-forward -n istio-system svc/prometheus 9090:9090
# Open: http://localhost:9090

# Access Grafana dashboards
kubectl port-forward -n istio-system svc/grafana 3000:3000
# Open: http://localhost:3000

# ========================================
# RESOURCE MONITORING
# ========================================

# Monitor resource usage (including sidecar)
kubectl top pods -n kubestock-staging --containers

# Monitor nodes resource usage
kubectl top nodes

# Check pod resource requests/limits
kubectl get pods -n kubestock-staging -o json | \
  jq '.items[] | {name: .metadata.name, containers: .spec.containers[].resources}'

# ========================================
# COMMON TROUBLESHOOTING
# ========================================

# Analyze Istio configuration for issues
istioctl analyze -n kubestock-staging

# Check for any Istio-related warnings/errors
kubectl get all -n istio-system

# Restart all pods to re-inject sidecars
kubectl rollout restart deployment -n kubestock-staging

# Check if namespace label is properly set
kubectl describe namespace kubestock-staging

# Verify VirtualService references valid hosts
kubectl get vs -n kubestock-staging -o yaml | grep -A5 "hosts:"

# Verify DestinationRule host matches VirtualService hosts
kubectl get dr,vs -n kubestock-staging -o yaml | grep "host:"

# ========================================
# CLEANUP & MAINTENANCE
# ========================================

# Remove a service from mesh (delete DestinationRule and VirtualService)
kubectl delete destinationrule ms-identity -n kubestock-staging
kubectl delete virtualservice ms-identity -n kubestock-staging

# Remove sidecar injection from namespace
kubectl label namespace kubestock-staging istio-injection- --overwrite

# Restart all deployments (forces sidecar re-injection)
kubectl rollout restart deploy -n kubestock-staging

# Scale deployment to trigger pod recreation
kubectl scale deployment ms-identity --replicas=0 -n kubestock-staging
kubectl scale deployment ms-identity --replicas=1 -n kubestock-staging

# ========================================
# SECURITY & POLICIES
# ========================================

# Check authorization policies
kubectl get authorizationpolicies -n kubestock-staging

# Check request authentication policies
kubectl get requestauthentication -n kubestock-staging

# Verify STRICT mTLS mode is enforced
kubectl get peerauthentication default -n istio-system -o jsonpath='{.spec.mtls.mode}'

# ========================================
# PERFORMANCE TUNING
# ========================================

# Check sidecar proxy stats
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/stats | grep -E "connections|requests"

# Monitor connection pooling
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/stats | grep "upstream_"

# Check circuit breaker status
kubectl exec <pod-name> -n kubestock-staging -c istio-proxy -- \
  curl localhost:15000/clusters | grep "out_of_request"

# ========================================
# NOTES
# ========================================

# Pod name format: <deployment>-<hash>
# Example: ms-identity-5d4b7c9f8-k9x2m
#
# Service names (DNS resolvable within cluster):
# - ms-identity.kubestock-staging.svc.cluster.local
# - ms-inventory.kubestock-staging.svc.cluster.local
# - etc.
#
# Short names work within same namespace:
# - ms-identity (resolves to ms-identity.kubestock-staging.svc.cluster.local)
#
# Istio system namespace: istio-system
# Application namespace: kubestock-staging
