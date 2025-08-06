import { storage } from "../storage";

class WearableService {
  async connectProvider(userId: string, provider: string, authCode: string): Promise<any> {
    try {
      // In a real implementation, this would exchange the auth code for access tokens
      // For now, we'll simulate the connection process
      
      const integrationData = {
        userId,
        provider,
        accessToken: `simulated_access_token_${userId}_${provider}`,
        refreshToken: `simulated_refresh_token_${userId}_${provider}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      };
      
      const integration = await storage.createWearableIntegration(integrationData);
      
      // Immediately sync some initial data
      await this.syncHealthData(userId);
      
      return integration;
    } catch (error) {
      console.error("Error connecting wearable provider:", error);
      throw new Error("Failed to connect wearable provider: " + (error as Error).message);
    }
  }

  async syncHealthData(userId: string): Promise<{
    synced: number;
    newDataPoints: any[];
  }> {
    try {
      const integrations = await storage.getUserWearableIntegrations(userId);
      const activeIntegrations = integrations.filter(i => i.isActive);
      
      let totalSynced = 0;
      const newDataPoints: any[] = [];
      
      for (const integration of activeIntegrations) {
        const syncedData = await this.syncProviderData(userId, integration.provider);
        totalSynced += syncedData.length;
        newDataPoints.push(...syncedData);
        
        // Update last sync time
        await storage.updateWearableIntegration(integration.id, {
          lastSync: new Date()
        });
      }
      
      return {
        synced: totalSynced,
        newDataPoints
      };
    } catch (error) {
      console.error("Error syncing health data:", error);
      throw new Error("Failed to sync health data: " + (error as Error).message);
    }
  }

  private async syncProviderData(userId: string, provider: string): Promise<any[]> {
    // Simulate syncing different types of health data based on provider
    const dataTypes = ['heart_rate', 'steps', 'sleep', 'calories_burned', 'active_minutes'];
    const syncedData: any[] = [];
    
    for (const dataType of dataTypes) {
      const simulatedValue = this.generateSimulatedHealthValue(dataType);
      
      const healthDataPoint = {
        userId,
        dataType,
        value: simulatedValue.value,
        unit: simulatedValue.unit,
        source: provider,
        recordedAt: new Date()
      };
      
      const savedData = await storage.createHealthData(healthDataPoint);
      syncedData.push(savedData);
    }
    
    return syncedData;
  }

  private generateSimulatedHealthValue(dataType: string): { value: number; unit: string } {
    switch (dataType) {
      case 'heart_rate':
        return {
          value: 60 + Math.random() * 40, // 60-100 BPM
          unit: 'bpm'
        };
      case 'steps':
        return {
          value: Math.floor(5000 + Math.random() * 10000), // 5,000-15,000 steps
          unit: 'steps'
        };
      case 'sleep':
        return {
          value: 6 + Math.random() * 3, // 6-9 hours
          unit: 'hours'
        };
      case 'calories_burned':
        return {
          value: Math.floor(1800 + Math.random() * 800), // 1,800-2,600 calories
          unit: 'calories'
        };
      case 'active_minutes':
        return {
          value: Math.floor(Math.random() * 120), // 0-120 minutes
          unit: 'minutes'
        };
      default:
        return {
          value: Math.random() * 100,
          unit: 'units'
        };
    }
  }

  async getHealthDataSummary(userId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      const allHealthData = await storage.getUserHealthData(userId);
      const filteredData = allHealthData.filter(
        data => new Date(data.recordedAt) >= startDate
      );
      
      // Group data by type and calculate averages
      const summary: any = {};
      const dataByType = filteredData.reduce((acc, data) => {
        if (!acc[data.dataType]) {
          acc[data.dataType] = [];
        }
        acc[data.dataType].push(data);
        return acc;
      }, {} as { [key: string]: any[] });
      
      for (const [dataType, dataPoints] of Object.entries(dataByType)) {
        const values = dataPoints.map(dp => dp.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        
        summary[dataType] = {
          average: Math.round(avg * 100) / 100,
          latest: values[values.length - 1],
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          unit: dataPoints[0]?.unit || 'units'
        };
      }
      
      return summary;
    } catch (error) {
      console.error("Error getting health data summary:", error);
      throw new Error("Failed to get health data summary: " + (error as Error).message);
    }
  }

  async disconnectProvider(userId: string, provider: string): Promise<void> {
    try {
      const integrations = await storage.getUserWearableIntegrations(userId);
      const integration = integrations.find(i => i.provider === provider);
      
      if (!integration) {
        throw new Error(`No ${provider} integration found for user`);
      }
      
      await storage.deleteWearableIntegration(integration.id);
    } catch (error) {
      console.error("Error disconnecting wearable provider:", error);
      throw new Error("Failed to disconnect wearable provider: " + (error as Error).message);
    }
  }

  async getAvailableProviders(): Promise<any[]> {
    return [
      {
        id: 'fitbit',
        name: 'Fitbit',
        description: 'Connect your Fitbit device to sync health and fitness data',
        icon: 'fab fa-fitbit',
        supported_data: ['steps', 'heart_rate', 'sleep', 'calories_burned', 'active_minutes']
      },
      {
        id: 'garmin',
        name: 'Garmin',
        description: 'Sync data from your Garmin watch or fitness tracker',
        icon: 'fas fa-watch',
        supported_data: ['steps', 'heart_rate', 'sleep', 'calories_burned', 'active_minutes', 'distance']
      },
      {
        id: 'apple_health',
        name: 'Apple Health',
        description: 'Connect with Apple Health to sync iPhone and Apple Watch data',
        icon: 'fab fa-apple',
        supported_data: ['steps', 'heart_rate', 'sleep', 'calories_burned', 'workouts']
      },
      {
        id: 'google_fit',
        name: 'Google Fit',
        description: 'Sync fitness data from Google Fit and compatible Android devices',
        icon: 'fab fa-google',
        supported_data: ['steps', 'heart_rate', 'calories_burned', 'active_minutes', 'workouts']
      }
    ];
  }
}

export const wearableService = new WearableService();
