import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeMovementForm } from "./services/openai";
import { workoutGeneratorService } from "./services/workoutGenerator";
import { movementAnalysis } from "../shared/schema";
import { db } from "./db";
import { gamificationService } from "./services/gamificationService";
import { wearableService } from "./services/wearableService";
import { insertWorkoutSessionSchema } from "../shared/schema";

// Utility function per ottenere userId in modo universale
function getUserId(req: any): string | null {
  if (process.env.NODE_ENV === 'development') {
    return req.user?.id || req.user?.claims?.sub || 'dev-user-123';
  }
  return req.user?.id || req.user?.claims?.sub || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'SQLite connected'
    });
  });

  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      if (process.env.NODE_ENV === 'development' && !process.env.REPL_ID) {
        res.json(req.user);
        return;
      }
      
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const dashboardData = await storage.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Movement analysis routes - SIMPLIFIED
  app.post('/api/movement-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req); 
      if (!userId) { 
        return res.status(401).json({ message: "User ID not found" }); 
      }
      
      const { exerciseName, videoData, sessionId } = req.body;
      
      if (!exerciseName) {
        return res.status(400).json({ message: "exerciseName is required" });
      }
      
      // Use OpenAI service for analysis
      const analysis = await analyzeMovementForm(exerciseName, []);
      
      // Save to database
      const result = await db.insert(movementAnalysis).values({
        userId,
        sessionId: sessionId || null,
        exerciseName,
        videoData: videoData || null,
        analysisResult: JSON.stringify(analysis),
      }).returning();
      
      res.json({
        id: result[0].id,
        ...analysis,
        userId,
        exerciseName,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
      
    } catch (error) {
      console.error("Error analyzing movement:", error);
      res.status(500).json({ 
        message: "Failed to analyze movement"
      });
    }
  });

  return httpServer;
}
