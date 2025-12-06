import apiClient from "../utils/axios";
import { API } from "../utils/constants";

export const orderService = {
  // Orders
  getAllOrders: async (params) => {
    const response = await apiClient.get(API.order.base(), { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await apiClient.get(API.order.byId(id));
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await apiClient.post(API.order.base(), orderData);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await apiClient.put(API.order.status(id), { status });
    return response.data;
  },

  cancelOrder: async (id, reason) => {
    const response = await apiClient.post(API.order.cancel(id), { reason });
    return response.data;
  },

  // Order Items
  getOrderItems: async (orderId) => {
    const response = await apiClient.get(API.order.items(orderId));
    return response.data;
  },

  // Order Statistics
  getOrderStats: async () => {
    const response = await apiClient.get(API.order.stats());
    return response.data;
  },
};
