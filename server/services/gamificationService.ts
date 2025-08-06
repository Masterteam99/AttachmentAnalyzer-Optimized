import { storage } from "../storage";
import type { InsertAchievement } from "@shared/schema";

interface AchievementRule {
  type: string;
  title: string;
  description: string;
  points?: number;
  condition: (userStats: any, userData: any) => boolean;
}

class GamificationService {
  private achievementRules: AchievementRule[] = [
    {
      type: "streak",
      title: "7-Day Streak",
      description: "Completed workouts for 7 days in a row!",
      condition: (userStats) => userStats.currentStreak >= 7
    },
    {
      type: "streak",
      title: "30-Day Streak",
      description: "Incredible! 30 days of consistent workouts!",
      condition: (userStats) => userStats.currentStreak >= 30
    },
    {
      type: "perfectionist",
      title: "Perfectionist",
      description: "Achieved 95%+ form accuracy in a workout!",
      condition: (userStats, userMovementData) => {
        const recentAnalyses = userMovementData || [];
        return recentAnalyses.some((analysis: any) => analysis.formScore >= 95);
      }
    },
    {
      type: "explorer",
      title: "Exercise Explorer",
      description: "Tried 10 different types of exercises!",
      condition: (userStats, userData) => {
        const sessions = userData.workoutSessions || [];
        const uniqueExercises = new Set(sessions.map((s: any) => s.name));
        return uniqueExercises.size >= 10;
      }
    },
    {
      type: "milestone",
      title: "Century Club",
      description: "Completed 100 workouts!",
      condition: (userStats) => userStats.totalWorkouts >= 100
    },
    {
      type: "milestone",
      title: "Calorie Crusher",
      description: "Burned over 10,000 calories total!",
      condition: (userStats) => userStats.totalCaloriesBurned >= 10000
    },
    {
      type: "consistency",
      title: "Weekend Warrior",
      description: "Worked out on both weekend days!",
      condition: (userStats, userData) => {
        const sessions = userData.workoutSessions || [];
        const recentWeekend = sessions.filter((session: any) => {
          const sessionDate = new Date(session.completedAt);
          const dayOfWeek = sessionDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
          const isRecent = Date.now() - sessionDate.getTime() < 7 * 24 * 60 * 60 * 1000; // Within last week
          return isWeekend && isRecent;
        });
        const weekendDays = new Set(recentWeekend.map((session: any) => 
          new Date(session.completedAt).getDay()
        ));
        return weekendDays.size >= 2;
      }
    },
    {
      type: "improvement",
      title: "Form Master",
      description: "Improved movement form by 20% or more!",
      condition: (userStats, userData) => {
        const analyses = userData.movementAnalyses || [];
        if (analyses.length < 2) return false;
        
        const recent = analyses.slice(0, 5);
        const older = analyses.slice(-5);
        
        const recentAvg = recent.reduce((sum: number, a: any) => sum + a.formScore, 0) / recent.length;
        const olderAvg = older.reduce((sum: number, a: any) => sum + a.formScore, 0) / older.length;
        
        return recentAvg - olderAvg >= 20;
      }
    }
  ];

  async checkAchievements(userId: string): Promise<any[]> {
    try {
      const userStats = await storage.getUserStats(userId);
      const existingAchievements = await storage.getUserAchievements(userId);
      const workoutSessions = await storage.getUserWorkoutSessions(userId, 100);
      const movementAnalyses = await storage.getUserMovementAnalysis(userId, 50);
      
      const userData = {
        workoutSessions,
        movementAnalyses
      };

      const existingTypes = new Set(existingAchievements.map(a => `${a.type}-${a.title}`));
      const newAchievements: InsertAchievement[] = [];

      for (const rule of this.achievementRules) {
        const ruleKey = `${rule.type}-${rule.title}`;
        
        if (!existingTypes.has(ruleKey) && rule.condition(userStats, userData)) {
          newAchievements.push({
            userId,
            type: rule.type,
            title: rule.title,
            description: rule.description,
            points: rule.points || 100 // Default points if not specified
          });
        }
      }

      // Save new achievements
      const savedAchievements = [];
      for (const achievement of newAchievements) {
        const saved = await storage.createAchievement(achievement);
        savedAchievements.push(saved);
      }

      return savedAchievements;
    } catch (error) {
      console.error("Error checking achievements:", error);
      throw new Error("Failed to check achievements: " + (error as Error).message);
    }
  }

  async calculateUserLevel(userId: string): Promise<{
    level: number;
    xp: number;
    xpToNextLevel: number;
    title: string;
  }> {
    try {
      const userStats = await storage.getUserStats(userId);
      const achievements = await storage.getUserAchievements(userId);
      
      // Calculate XP based on various activities
      let totalXP = 0;
      
      // XP from workouts
      totalXP += (userStats?.totalWorkouts || 0) * 10;
      
      // XP from achievements
      totalXP += achievements.length * 50;
      
      // XP from streak bonus
      if (userStats?.currentStreak) {
        totalXP += Math.min(userStats.currentStreak * 5, 200); // Cap streak bonus
      }
      
      // XP from calories burned (1 XP per 100 calories)
      totalXP += Math.floor((userStats?.totalCaloriesBurned || 0) / 100);
      
      // Calculate level (every 1000 XP = 1 level)
      const level = Math.floor(totalXP / 1000) + 1;
      const xpInCurrentLevel = totalXP % 1000;
      const xpToNextLevel = 1000 - xpInCurrentLevel;
      
      // Determine title based on level
      const titles = [
        "Fitness Newbie", "Workout Warrior", "Strength Seeker", "Endurance Expert",
        "Fitness Fanatic", "Training Titan", "Exercise Elite", "Gym Guardian",
        "Fitness Master", "Legendary Lifter"
      ];
      
      const titleIndex = Math.min(Math.floor((level - 1) / 5), titles.length - 1);
      const title = titles[titleIndex];
      
      return {
        level,
        xp: totalXP,
        xpToNextLevel,
        title
      };
    } catch (error) {
      console.error("Error calculating user level:", error);
      throw new Error("Failed to calculate user level: " + (error as Error).message);
    }
  }

  async getLeaderboard(userId: string, timeframe: 'week' | 'month' | 'all' = 'week'): Promise<any[]> {
    try {
      // In a real implementation, this would query multiple users
      // For now, we'll return a simplified leaderboard
      
      const userLevel = await this.calculateUserLevel(userId);
      const userStats = await storage.getUserStats(userId);
      const user = await storage.getUser(userId);
      
      // Mock leaderboard data (in real app, this would be actual user data)
      const mockLeaderboard = [
        {
          userId: "user1",
          name: "FitnessPro",
          level: userLevel.level + 2,
          xp: userLevel.xp + 2000,
          weeklyWorkouts: 7,
          position: 1
        },
        {
          userId: "user2", 
          name: "GymHero",
          level: userLevel.level + 1,
          xp: userLevel.xp + 1000,
          weeklyWorkouts: 6,
          position: 2
        },
        {
          userId,
          name: `${user?.firstName} ${user?.lastName}`.trim() || "You",
          level: userLevel.level,
          xp: userLevel.xp,
          weeklyWorkouts: userStats?.weeklyProgress || 0,
          position: 3
        }
      ];
      
      return mockLeaderboard;
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw new Error("Failed to get leaderboard: " + (error as Error).message);
    }
  }

  async getMotivationalMessage(userId: string): Promise<string> {
    try {
      const userStats = await storage.getUserStats(userId);
      const recentAchievements = await storage.getUserAchievements(userId);
      
      const messages = [];
      
      // Streak-based messages
      const currentStreak = userStats?.currentStreak || 0;
      if (currentStreak >= 7) {
        messages.push(`Amazing! You're on a ${currentStreak}-day streak! 🔥`);
      } else if (currentStreak >= 3) {
        messages.push(`Great momentum! ${currentStreak} days and counting! 💪`);
      }
      
      // Progress-based messages
      const weeklyProgress = userStats?.weeklyProgress || 0;
      const weeklyGoal = userStats?.weeklyGoal || 0;
      if (weeklyProgress >= weeklyGoal && weeklyGoal > 0) {
        messages.push("You've smashed your weekly goal! Time to celebrate! 🎉");
      } else if (weeklyProgress === weeklyGoal - 1 && weeklyGoal > 0) {
        messages.push("So close! One more workout to hit your weekly goal! 🎯");
      }
      
      // Achievement-based messages
      if (recentAchievements.length > 0) {
        const latestAchievement = recentAchievements[0];
        const earnedAt = latestAchievement.earnedAt;
        if (earnedAt) {
          const timeSince = Date.now() - new Date(earnedAt).getTime();
          if (timeSince < 24 * 60 * 60 * 1000) { // Within last 24 hours
            messages.push(`Congratulations on earning "${latestAchievement.title}"! 🏆`);
          }
        }
      }
      
      // Default motivational messages
      const defaultMessages = [
        "Every workout counts! You've got this! 💪",
        "Progress, not perfection. Keep moving forward! 🚀",
        "Your future self will thank you for today's effort! ⭐",
        "Strong people don't get it easy, they get it by working hard! 💯",
        "The only workout you regret is the one you didn't do! 🏃‍♂️"
      ];
      
      if (messages.length === 0) {
        const randomIndex = Math.floor(Math.random() * defaultMessages.length);
        messages.push(defaultMessages[randomIndex]);
      }
      
      return messages[Math.floor(Math.random() * messages.length)];
    } catch (error) {
      console.error("Error getting motivational message:", error);
      return "Keep pushing forward! You're doing great! 💪";
    }
  }
}

export const gamificationService = new GamificationService();
