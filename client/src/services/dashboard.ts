import { api } from "./api";

export const dashboardService = {
  async getStats() {
    const response = await api.getDashboardStats();
    return response.json();
  },
};
