import { api } from "./api";

export const wearableService = {
  async getIntegrations() {
    const response = await api.getWearableIntegrations();
    return response.json();
  },

  async connectDevice(provider: string, authCode: string) {
    const response = await api.connectWearable({ provider, authCode });
    return response.json();
  },

  async syncData() {
    const response = await api.syncWearableData();
    return response.json();
  },

  async getHealthData(type?: string, limit?: number) {
    const response = await api.getHealthData(type, limit);
    return response.json();
  },
};
