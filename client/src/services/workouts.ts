import { api } from "./api";

export const workoutService = {
  async getPlans() {
    const response = await api.getWorkoutPlans();
    return response.json();
  },

  async createPlan(data: any) {
    const response = await api.createWorkoutPlan(data);
    return response.json();
  },

  async generatePlan(preferences: any) {
    const response = await api.generateWorkoutPlan(preferences);
    return response.json();
  },

  async getPlan(id: number) {
    const response = await api.getWorkoutPlan(id);
    return response.json();
  },

  async createSession(data: any) {
    const response = await api.createWorkoutSession(data);
    return response.json();
  },

  async getSessions(limit?: number) {
    const response = await api.getWorkoutSessions(limit);
    return response.json();
  },

  async analyzeMovement(data: { exerciseName: string; videoData: string; sessionId?: number }) {
    const response = await api.analyzeMovement(data);
    return response.json();
  },

  async getMovementAnalyses(limit?: number) {
    const response = await api.getMovementAnalyses(limit);
    return response.json();
  },
};
