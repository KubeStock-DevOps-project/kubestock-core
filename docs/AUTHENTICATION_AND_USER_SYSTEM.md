# Authentication & User System Documentation

> **Document Version:** 1.0  
> **Last Updated:** December 1, 2025  
> **Status:** Current State Analysis (Pre-Cleanup)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Backend Authentication](#backend-authentication)
4. [Frontend Authentication](#frontend-authentication)
5. [User Management System](#user-management-system)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Identified Issues & Inconsistencies](#identified-issues--inconsistencies)
9. [Recommendations for Cleanup](#recommendations-for-cleanup)

---

## Overview

The system implements a **hybrid authentication approach** that combines:
1. **WSO2 Asgardeo** - OAuth 2.0/OIDC identity provider for SSO
2. **Local JWT Authentication** - Legacy username/password authentication with JWT tokens

This dual-auth approach creates complexity and inconsistencies throughout the codebase.

### Key Technologies
- **Frontend:** React 19, Vite, @asgardeo/auth-react v5.4.3
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Identity Provider:** WSO2 Asgardeo

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     React Application                         │   │
│  │  ┌─────────────────┐     ┌────────────────────────────────┐ │   │
│  │  │ Asgardeo Auth   │────▶│ AsgardeoAuthContext.jsx        │ │   │
│  │  │ Provider        │     │ (Primary Auth - Uses Asgardeo) │ │   │
│  │  └─────────────────┘     └────────────────────────────────┘ │   │
│  │                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ AuthContext.jsx (Legacy - Not Currently Used)           │ │   │
│  │  │ Uses local authService.js for JWT auth                  │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     User Service (Port 3001)                  │   │
│  │  ┌────────────────────┐  ┌────────────────────────────────┐ │   │
│  │  │ asgardeo.middleware│  │ auth.middleware.js (Legacy)    │ │   │
│  │  │ (Used on routes)   │  │ (NOT USED - JWT based)         │ │   │
│  │  └────────────────────┘  └────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Other Services (Product, Inventory, Supplier, Order)         │   │
│  │ • Have both auth.middleware.js and asgardeo.middleware.js   │   │
│  │ • NEITHER middleware is used on routes                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend Authentication

### 1. Asgardeo Middleware (Primary)

**Location:** `backend/middleware/asgardeo.middleware.js`  
**Also copied to:** Each service's `src/middlewares/asgardeo.middleware.js`

**Purpose:** Validates OAuth 2.0 access tokens from WSO2 Asgardeo

#### Key Components

```javascript
// JWKS Client for token signature verification
const client = jwksClient({
  jwksUri: asgardeo.jwksUri || `${asgardeo.baseUrl}/oauth2/jwks`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});
```

#### Exported Functions

| Function | Description |
|----------|-------------|
| `authenticateAsgardeo` | Main middleware - validates Bearer token, verifies JWT signature, attaches user to `req.user` |
| `authorizeRoles(...roles)` | Role-based authorization middleware |
| `optionalAuth` | Non-failing auth - continues without user if no token |
| `verifyToken(token)` | Verifies and decodes Asgardeo access token |
| `getUserInfo(accessToken)` | Fetches user info from Asgardeo userinfo endpoint |

#### User Object Structure (req.user)

```javascript
req.user = {
  sub: decoded.sub,                    // Asgardeo subject ID
  username: decoded.username || userInfo?.username,
  email: decoded.email || userInfo?.email,
  roles: decoded.groups || decoded.roles || [],
  scope: decoded.scope,
  ...userInfo                          // All additional userinfo claims
};
```

### 2. Legacy JWT Middleware (Unused)

**Location:** `backend/services/user-service/src/middlewares/auth.middleware.js`  
**Also in:** Other services' `src/middleware/auth.middleware.js`

**Purpose:** Original local JWT authentication (NOT CURRENTLY USED)

```javascript
// Uses simple JWT verification with local secret
jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  req.user = {
    id: decoded.id || decoded.userId,
    username: decoded.username,
    role: decoded.role  // Note: singular 'role' vs 'roles' in Asgardeo
  };
});
```

### 3. Asgardeo Configuration

**Shared Config:** `backend/config/asgardeo.config.js`  
**Per-Service Config:** Each service has `src/config/asgardeo.config.js`

```javascript
module.exports = {
  asgardeo: {
    baseUrl: process.env.ASGARDEO_BASE_URL || 'https://api.asgardeo.io/t/{org}',
    tokenEndpoint: process.env.ASGARDEO_TOKEN_ENDPOINT,
    jwksUri: process.env.ASGARDEO_JWKS_URI,
    issuer: process.env.ASGARDEO_ISSUER,
    clientId: process.env.ASGARDEO_CLIENT_ID,
    clientSecret: process.env.ASGARDEO_CLIENT_SECRET,
    audience: process.env.ASGARDEO_AUDIENCE || process.env.ASGARDEO_CLIENT_ID,
    tokenValidation: {
      clockTolerance: 60,  // seconds
      maxAge: 3600,        // 1 hour
    }
  }
};
```

### 4. Route Protection Status by Service

| Service | Authentication Middleware Used | Routes Protected |
|---------|-------------------------------|------------------|
| User Service | `authenticateAsgardeo` | `/api/auth/profile`, `/api/auth/change-password`, `/api/users/*` |
| Product Catalog | **NONE** | All routes are PUBLIC |
| Inventory Service | **NONE** | All routes are PUBLIC |
| Supplier Service | **NONE** | All routes are PUBLIC |
| Order Service | **NONE** | All routes are PUBLIC |

---

## Frontend Authentication

### 1. Asgardeo Integration (Primary)

**Provider:** `@asgardeo/auth-react` v5.4.3  
**Configuration:** `frontend/src/config/asgardeo.config.js`

```javascript
export const asgardeoConfig = {
  baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL,
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,
  // Always uses window.location.origin - adapts to any environment automatically
  signInRedirectURL: window.location.origin,
  signOutRedirectURL: window.location.origin,
  scope: ["openid", "profile", "email", "groups"],
  enablePKCE: true,
  responseMode: "query",
  storage: "sessionStorage"
};
```

### 2. Auth Context Hierarchy

```jsx
// App.jsx - Provider Hierarchy
<AsgardeoAuthProvider config={asgardeoConfig}>  {/* @asgardeo/auth-react */}
  <Router>
    <AuthProvider>  {/* Custom AsgardeoAuthContext.jsx */}
      {/* Application Routes */}
    </AuthProvider>
  </Router>
</AsgardeoAuthProvider>
```

### 3. AsgardeoAuthContext.jsx (Active Auth Context)

**Location:** `frontend/src/context/AsgardeoAuthContext.jsx`

#### Key Features

1. **Token Retrieval Strategy:** Uses a multi-method approach to get JWT:
   ```javascript
   const getRealAccessToken = async () => {
     // Method 1: Try ID Token (preferred - always JWT format)
     const idToken = await getIDToken();
     
     // Method 2: Check sessionStorage
     const sessionData = sessionStorage.getItem(`session_data-${clientId}`);
     
     // Method 3: Fallback to getAccessToken()
     return await getAccessToken();
   };
   ```

2. **Role Mapping:** Maps Asgardeo groups to application roles
   ```javascript
   const mapAsgardeoRoleToAppRole = (groups) => {
     if (groups.some(g => g.toLowerCase().includes('admin'))) return 'admin';
     if (groups.some(g => g.toLowerCase().includes('warehouse') || 
                        g.toLowerCase().includes('staff'))) return 'warehouse_staff';
     if (groups.some(g => g.toLowerCase().includes('supplier'))) return 'supplier';
     return 'warehouse_staff';  // Default
   };
   ```

3. **Token Storage:** Stores tokens in localStorage for API calls
   ```javascript
   localStorage.setItem('asgardeo_token', accessToken);
   localStorage.setItem('token', accessToken);  // Dual storage for compatibility
   ```

#### Exposed Context Values

```javascript
const value = {
  user,                    // Mapped user object
  loading,                 // Auth loading state
  login,                   // Triggers Asgardeo signIn
  logout,                  // Clears session and redirects
  updateUser,              // Updates user state
  isAuthenticated,         // Boolean from Asgardeo state
  hasRole: (roles) => {},  // Role checking function
  getAccessToken,          // Custom token getter
  getIDToken,              // Asgardeo ID token
  asgardeoState            // Raw Asgardeo state
};
```

### 4. Legacy AuthContext.jsx (Unused)

**Location:** `frontend/src/context/AuthContext.jsx`

Original context using local JWT auth with `authService.js`. Not currently used but still in codebase.

```javascript
// Uses authService for login/register
const login = async (credentials) => {
  const data = await authService.login(credentials);
  setUser(data.user);
};
```

### 5. Auth Services

#### authService.js (Partial Use)

```javascript
export const authService = {
  login: async (credentials) => {/* Local JWT login */},
  register: async (userData) => {/* Local registration */},
  logout: () => {/* Clear localStorage */},
  getCurrentUser: async () => {/* Get profile from API */},
  changePassword: async (passwordData) => {/* Change password */},
  getStoredUser: () => {/* Get from localStorage */},
  getToken: () => localStorage.getItem("token"),
  isAuthenticated: () => !!localStorage.getItem("token")
};
```

#### axios.js (Token Interceptor)

```javascript
// Handles both token types
api.interceptors.request.use((config) => {
  const asgardeoToken = localStorage.getItem("asgardeo_token");
  const jwtToken = localStorage.getItem("token");
  const token = asgardeoToken || jwtToken;  // Prefers Asgardeo token
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 6. Protected Routes

**Component:** `frontend/src/components/auth/ProtectedRoute.jsx`

```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/products" replace />;
  }
  return children;
};
```

### 7. Login Flow

1. User clicks "Sign In with Asgardeo" on `/login`
2. `login()` function calls Asgardeo `signIn()`
3. User redirected to Asgardeo login page
4. After authentication, user redirected to `/callback`
5. `AsgardeoAuthContext` detects `isAuthenticated` state change
6. User info fetched, roles mapped, tokens stored
7. User redirected to role-appropriate dashboard

---

## User Management System

### User Model

**Location:** `backend/services/user-service/src/models/user.model.js`

```javascript
class User {
  static async create(userData) {/* INSERT INTO users */}
  static async findById(id) {/* SELECT * FROM users WHERE id = $1 */}
  static async findByEmail(email) {/* SELECT * FROM users WHERE email = $1 */}
  static async findByUsername(username) {/* SELECT * FROM users */}
  static async findAll(filters) {/* SELECT with filters */}
  static async update(id, userData) {/* UPDATE users */}
  static async delete(id) {/* DELETE FROM users */}
}
```

### User Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `warehouse_staff` | Inventory and product management |
| `supplier` | Supplier-specific operations |

---

## Database Schema

**Location:** `backend/database/init-schemas.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'warehouse_staff', 'supplier')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

---

## API Endpoints

### User Service (Port 3001)

#### Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Register new user (local) |
| POST | `/login` | No | Login with email/password (local) |
| GET | `/profile` | Yes (Asgardeo) | Get current user profile |
| PUT | `/profile` | Yes (Asgardeo) | Update profile |
| PUT | `/change-password` | Yes (Asgardeo) | Change password |

#### User Management Routes (`/api/users`)

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| GET | `/` | Yes (Asgardeo) | admin | List all users |
| GET | `/:id` | Yes (Asgardeo) | admin | Get user by ID |
| POST | `/` | Yes (Asgardeo) | admin | Create user |
| PUT | `/:id` | Yes (Asgardeo) | admin | Update user |
| DELETE | `/:id` | Yes (Asgardeo) | admin | Delete user |

---

## Identified Issues & Inconsistencies

### Critical Issues

1. **Dual Authentication Systems**
   - Both Asgardeo (OAuth 2.0) and local JWT auth exist
   - Creates confusion and maintenance overhead
   - `AuthContext.jsx` and `AsgardeoAuthContext.jsx` both exist

2. **Unprotected Backend Services**
   - Product Catalog, Inventory, Supplier, and Order services have NO route protection
   - Authentication middleware exists but is NOT applied to routes
   - Anyone can access these APIs without authentication

3. **Duplicate Middleware Files**
   - `asgardeo.middleware.js` is duplicated across all services
   - `auth.middleware.js` (legacy JWT) also duplicated
   - No shared middleware package

4. **Inconsistent Role Handling**
   - Asgardeo uses `groups` claim for roles
   - Backend expects `roles` array
   - Legacy auth uses singular `role` property
   - Role mapping logic embedded in frontend

5. **Token Storage Duplication**
   - Tokens stored as both `asgardeo_token` AND `token` in localStorage
   - Axios interceptor checks both

### Code Smell Issues

6. **Unused Code**
   - `AuthContext.jsx` (legacy) still in codebase
   - `AsgardeoLogin.jsx` page exists alongside `Login.jsx`
   - Legacy `auth.middleware.js` not used

7. **User ID Mismatch**
   - Asgardeo uses `sub` (string UUID) as user identifier
   - Local database uses integer `id`
   - Auth controller tries to lookup by both:
   ```javascript
   // First tries email lookup for Asgardeo users
   let user = await User.findByEmail(userEmail);
   // Falls back to ID for legacy users
   if (!user && userId) user = await User.findById(userId);
   ```

8. **Password Hash in Asgardeo Flow**
   - `password_hash` column exists in database
   - Required for local auth but not used with Asgardeo
   - Change password endpoint exists but users authenticate via Asgardeo

9. **Registration Inconsistency**
   - `/register` page redirects to Asgardeo login (same as login page)
   - Local registration endpoint exists but not used from UI
   - No clear user provisioning from Asgardeo to local database

### Configuration Issues

10. **Environment Variables Scattered**
    - Asgardeo config needs multiple env vars
    - Each service has its own `.env.example`
    - No centralized configuration management

11. **Hardcoded Defaults**
    - Default Asgardeo org `dilanorg` in frontend config
    - Debug console.logs throughout production code

---

## Recommendations for Cleanup

### Phase 1: Immediate Actions

1. **Remove Legacy Auth Code**
   - Delete `AuthContext.jsx`
   - Delete `AsgardeoLogin.jsx`
   - Remove all `auth.middleware.js` files
   - Remove `/api/auth/register` and `/api/auth/login` endpoints

2. **Protect All Services**
   - Apply `authenticateAsgardeo` middleware to all service routes
   - Create consistent role requirements per endpoint

3. **Centralize Middleware**
   - Create shared `@kubestock/middleware` package
   - Single source of truth for `asgardeo.middleware.js`

### Phase 2: Architecture Improvements

4. **User Provisioning**
   - Implement Just-in-Time (JIT) provisioning
   - Create user record on first Asgardeo login
   - Sync Asgardeo groups to local roles

5. **Token Management**
   - Use only `token` key in localStorage
   - Remove dual storage approach
   - Implement token refresh logic

6. **Clean Up Console Logs**
   - Remove all debug `console.log` statements
   - Implement proper logging service

### Phase 3: Long-term

7. **Consider API Gateway**
   - Centralize authentication at gateway level
   - Services trust gateway's user header
   - Simplifies per-service auth code

8. **Service-to-Service Auth**
   - Implement client credentials flow for inter-service communication
   - Consider service mesh (Istio/Linkerd) for mTLS

---

## File Reference

### Backend Files

| File | Purpose | Status |
|------|---------|--------|
| `backend/middleware/asgardeo.middleware.js` | Shared Asgardeo middleware | ACTIVE |
| `backend/config/asgardeo.config.js` | Shared Asgardeo config | ACTIVE |
| `backend/services/user-service/src/middlewares/asgardeo.middleware.js` | Service-level copy | REDUNDANT |
| `backend/services/user-service/src/middlewares/auth.middleware.js` | Legacy JWT auth | UNUSED |
| `backend/services/user-service/src/controllers/auth.controller.js` | Auth endpoints | PARTIAL USE |
| `backend/services/user-service/src/controllers/user.controller.js` | User CRUD | ACTIVE |
| `backend/services/user-service/src/models/user.model.js` | User database model | ACTIVE |
| `backend/services/user-service/src/routes/auth.routes.js` | Auth route definitions | ACTIVE |
| `backend/services/user-service/src/routes/user.routes.js` | User route definitions | ACTIVE |

### Frontend Files

| File | Purpose | Status |
|------|---------|--------|
| `frontend/src/config/asgardeo.config.js` | Asgardeo SDK config | ACTIVE |
| `frontend/src/context/AsgardeoAuthContext.jsx` | Primary auth context | ACTIVE |
| `frontend/src/context/AuthContext.jsx` | Legacy auth context | UNUSED |
| `frontend/src/services/authService.js` | Auth API calls | PARTIAL USE |
| `frontend/src/services/userService.js` | User API calls | ACTIVE |
| `frontend/src/utils/axios.js` | HTTP client with token interceptor | ACTIVE |
| `frontend/src/components/auth/ProtectedRoute.jsx` | Route protection | ACTIVE |
| `frontend/src/components/auth/RootRedirect.jsx` | Role-based redirect | ACTIVE |
| `frontend/src/pages/auth/Login.jsx` | Login page (Asgardeo) | ACTIVE |
| `frontend/src/pages/auth/Register.jsx` | Register page (redirects to Asgardeo) | ACTIVE |
| `frontend/src/pages/auth/Callback.jsx` | OAuth callback handler | ACTIVE |
| `frontend/src/pages/auth/AsgardeoLogin.jsx` | Duplicate login page | UNUSED |

---

*This document serves as a baseline for understanding the current state of the authentication and user management system before cleanup and refactoring.*
