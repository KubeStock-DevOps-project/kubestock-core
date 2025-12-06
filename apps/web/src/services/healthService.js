import apiClient from "../utils/axios";
import { API } from "../utils/constants";

export const healthService = {
  checkProductService: async () => {
    try {
      const response = await apiClient.get(API.product.health(), { timeout: 5000 });
      return {
        status: "healthy",
        service: "Product Catalog Service",
        data: response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: "Product Catalog Service",
        error: error.message,
      };
    }
  },

  checkInventoryService: async () => {
    try {
      const response = await apiClient.get(API.inventory.health(), { timeout: 5000 });
      return {
        status: "healthy",
        service: "Inventory Service",
        data: response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: "Inventory Service",
        error: error.message,
      };
    }
  },

  checkSupplierService: async () => {
    try {
      const response = await apiClient.get(API.supplier.health(), { timeout: 5000 });
      return {
        status: "healthy",
        service: "Supplier Service",
        data: response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: "Supplier Service",
        error: error.message,
      };
    }
  },

  checkOrderService: async () => {
    try {
      const response = await apiClient.get(API.order.health(), { timeout: 5000 });
      return {
        status: "healthy",
        service: "Order Service",
        data: response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: "Order Service",
        error: error.message,
      };
    }
  },

  checkIdentityService: async () => {
    try {
      const response = await apiClient.get(API.identity.health(), { timeout: 5000 });
      return {
        status: "healthy",
        service: "Identity Service",
        data: response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: "Identity Service",
        error: error.message,
      };
    }
  },

  checkGateway: async () => {
    const healthUrl = API.gateway.health();
    if (!healthUrl) {
      return {
        status: "skipped",
        service: "API Gateway",
        message: "Not available in development mode",
      };
    }
    try {
      const response = await apiClient.get(healthUrl, { timeout: 5000 });
      return {
        status: "healthy",
        service: "API Gateway",
        data: response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: "API Gateway",
        error: error.message,
      };
    }
  },

  checkAllServices: async () => {
    const results = await Promise.all([
      healthService.checkGateway(),
      healthService.checkProductService(),
      healthService.checkInventoryService(),
      healthService.checkSupplierService(),
      healthService.checkOrderService(),
      healthService.checkIdentityService(),
    ]);
    return results;
  },
};
