import { createContext, useContext, useState, useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AsgardeoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Asgardeo hooks
  const {
    state,
    signIn,
    signOut,
    getBasicUserInfo,
    getIDToken,
    getAccessToken,
    on,
  } = useAuthContext();

  // Sync Asgardeo state with our user state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (state.isAuthenticated) {
          // Get user info from Asgardeo
          const basicUserInfo = await getBasicUserInfo();
          const accessToken = await getAccessToken();

          // Map Asgardeo user to our user format
          const mappedUser = {
            id: basicUserInfo.sub,
            username:
              basicUserInfo.username || basicUserInfo.email?.split("@")[0],
            email: basicUserInfo.email,
            role: mapAsgardeoRoleToAppRole(basicUserInfo.groups || []),
            asgardeoUser: basicUserInfo,
            accessToken: accessToken,
          };

          setUser(mappedUser);

          // Store token in API service
          if (accessToken) {
            localStorage.setItem("asgardeo_token", accessToken);
          }
        } else {
          setUser(null);
          localStorage.removeItem("asgardeo_token");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [state.isAuthenticated]);

  /**
   * Map Asgardeo groups/roles to application roles
   * Customize this based on your Asgardeo role configuration
   */
  const mapAsgardeoRoleToAppRole = (groups) => {
    if (!groups || groups.length === 0) return "customer";

    // Check for admin role
    if (groups.some((g) => g.toLowerCase().includes("admin"))) {
      return "admin";
    }

    // Check for warehouse staff
    if (
      groups.some(
        (g) =>
          g.toLowerCase().includes("warehouse") ||
          g.toLowerCase().includes("staff")
      )
    ) {
      return "warehouse_staff";
    }

    // Check for supplier
    if (groups.some((g) => g.toLowerCase().includes("supplier"))) {
      return "supplier";
    }

    // Default to customer
    return "customer";
  };

  const login = async () => {
    try {
      await signIn();
      // The actual login redirect will be handled by Asgardeo
      // User will be set in the useEffect when they return
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      localStorage.removeItem("asgardeo_token");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({
      ...prev,
      ...userData,
    }));
  };

  // Handle post-login navigation
  useEffect(() => {
    if (user && !loading) {
      // Only navigate on initial login, not on page refresh
      const hasNavigated = sessionStorage.getItem("has_navigated");

      if (!hasNavigated) {
        const role = user.role;
        if (role === "admin") {
          navigate("/dashboard/admin");
        } else if (role === "warehouse_staff") {
          navigate("/dashboard/warehouse");
        } else if (role === "supplier") {
          navigate("/dashboard/supplier");
        } else {
          navigate("/products");
        }

        sessionStorage.setItem("has_navigated", "true");
        toast.success(`Welcome back, ${user.username}!`);
      }
    }
  }, [user, loading]);

  const value = {
    user,
    loading: loading || state.isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: state.isAuthenticated,
    hasRole: (roles) => {
      if (!user) return false;
      if (Array.isArray(roles)) {
        return roles.includes(user.role);
      }
      return user.role === roles;
    },
    // Expose Asgardeo methods for advanced use
    getAccessToken,
    getIDToken,
    asgardeoState: state,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Keep backward compatibility with old AuthProvider name
export const AuthProvider = AsgardeoAuthProvider;
