/**
 * Asgardeo Frontend Configuration
 *
 * Setup Instructions:
 * 1. Go to https://console.asgardeo.io
 * 2. Create a Single Page Application
 * 3. Configure authorized redirect URLs
 * 4. Copy Client ID to .env file
 */

export const asgardeoConfig = {
  // Your Asgardeo organization name (from yourorg.asgardeo.io)
  baseUrl:
    import.meta.env.VITE_ASGARDEO_BASE_URL ||
    "https://api.asgardeo.io/t/dilanorg",

  // Client ID from Asgardeo console
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,

  // Redirect URLs
  signInRedirectURL: import.meta.env.VITE_APP_URL || "http://localhost:5173",
  signOutRedirectURL: import.meta.env.VITE_APP_URL || "http://localhost:5173",

  // OAuth scopes
  scope: ["openid", "profile", "email"],

  // Enable PKCE (recommended for SPAs)
  enablePKCE: true,

  // Response mode
  responseMode: "query",

  // Storage type
  storage: "sessionStorage", // or 'localStorage'

  // Disable default session validation
  validateIDTokenIssuer: true,

  // Clock tolerance for token validation (in seconds)
  clockTolerance: 60,
};

export default asgardeoConfig;
