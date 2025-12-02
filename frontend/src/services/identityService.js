/**
 * Identity Service
 * Handles user management via Asgardeo SCIM2 proxy
 * Only admins can use these endpoints
 */
import { createApiClient } from "../utils/axios";
import { SERVICES, API_ENDPOINTS } from "../utils/constants";

const identityApi = createApiClient(SERVICES.IDENTITY);

export const identityService = {
  // ============================================
  // Supplier User Management
  // ============================================
  
  /**
   * Get all suppliers (users in supplier group)
   */
  listSuppliers: async () => {
    const response = await identityApi.get(API_ENDPOINTS.IDENTITY.SUPPLIERS);
    return response.data;
  },

  /**
   * Create a new supplier user
   * @param {Object} supplierData - { email, firstName, lastName, phone }
   */
  createSupplier: async (supplierData) => {
    const response = await identityApi.post(API_ENDPOINTS.IDENTITY.SUPPLIERS, supplierData);
    return response.data;
  },

  // ============================================
  // Warehouse Staff User Management
  // ============================================
  
  /**
   * Get all warehouse staff (users in warehouse_staff group)
   */
  listWarehouseStaff: async () => {
    const response = await identityApi.get(API_ENDPOINTS.IDENTITY.STAFF);
    return response.data;
  },

  /**
   * Create a new warehouse staff user
   * @param {Object} staffData - { email, firstName, lastName, phone }
   */
  createWarehouseStaff: async (staffData) => {
    const response = await identityApi.post(API_ENDPOINTS.IDENTITY.STAFF, staffData);
    return response.data;
  },

  // ============================================
  // Generic User Operations
  // ============================================
  
  /**
   * Get user by ID
   */
  getUser: async (userId) => {
    const response = await identityApi.get(`${API_ENDPOINTS.IDENTITY.USERS}/${userId}`);
    return response.data;
  },

  /**
   * Delete a user (supplier or staff)
   */
  deleteUser: async (userId) => {
    const response = await identityApi.delete(`${API_ENDPOINTS.IDENTITY.USERS}/${userId}`);
    return response.data;
  },

  // ============================================
  // Group Management
  // ============================================
  
  /**
   * List all groups
   */
  listGroups: async () => {
    const response = await identityApi.get(API_ENDPOINTS.IDENTITY.GROUPS);
    return response.data;
  },
};

export default identityService;
