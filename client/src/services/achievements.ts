import { api } from "./api";

export const achievementService = {
  async getAchievements() {
    const response = await api.getAchievements();
    return response.json();
  },
};
