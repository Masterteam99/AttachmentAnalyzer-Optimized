import { apiRequest } from "@/lib/queryClient";

export const api = {
  // Dashboard
  getDashboardStats: () => apiRequest("GET", "/api/dashboard/stats"),
  
  // Workout Plans
  getWorkoutPlans: () => apiRequest("GET", "/api/workout-plans"),
  createWorkoutPlan: (data: any) => apiRequest("POST", "/api/workout-plans", data),
  generateWorkoutPlan: (preferences: any) => apiRequest("POST", "/api/workout-plans/generate", { preferences }),
  getWorkoutPlan: (id: number) => apiRequest("GET", `/api/workout-plans/${id}`),
  
  // Workout Sessions
  createWorkoutSession: (data: any) => apiRequest("POST", "/api/workout-sessions", data),
  getWorkoutSessions: (limit?: number) => apiRequest("GET", `/api/workout-sessions${limit ? `?limit=${limit}` : ""}`),
  
  // Movement Analysis
  analyzeMovement: (data: { exerciseName: string; videoData: string; sessionId?: number }) =>
    apiRequest("POST", "/api/movement-analysis", data),
  getMovementAnalyses: (limit?: number) => apiRequest("GET", `/api/movement-analysis${limit ? `?limit=${limit}` : ""}`),
  
  // Achievements
  getAchievements: () => apiRequest("GET", "/api/achievements"),
  
  // Wearables
  getWearableIntegrations: () => apiRequest("GET", "/api/wearables/integrations"),
  connectWearable: (data: { provider: string; authCode: string }) => 
    apiRequest("POST", "/api/wearables/connect", data),
  syncWearableData: () => apiRequest("POST", "/api/wearables/sync"),
  getHealthData: (type?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (limit) params.append("limit", limit.toString());
    return apiRequest("GET", `/api/health-data${params.toString() ? `?${params.toString()}` : ""}`);
  },
  
  // Subscription
  createSubscription: () => apiRequest("POST", "/api/create-subscription"),
  cancelSubscription: () => apiRequest("POST", "/api/subscription/cancel"),
  
  // GDPR
  exportData: () => apiRequest("POST", "/api/gdpr/export"),
  deleteAccount: () => apiRequest("DELETE", "/api/gdpr/delete-account"),
};
