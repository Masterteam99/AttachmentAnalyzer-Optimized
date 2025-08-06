import { storage } from "../storage";
import { generateWorkoutPlan } from "./openai";
import type { InsertWorkoutPlan, InsertExercise } from "@shared/schema";

class WorkoutGeneratorService {
  async generatePersonalizedPlan(userId: string, preferences: {
    goals?: string[];
    timeAvailable?: number;
    equipment?: string[];
    fitnessLevel?: number;
    injuries?: string[];
  }): Promise<any> {
    try {
      // Get user data to inform the plan
      const user = await storage.getUser(userId);
      const userStats = await storage.getUserStats(userId);
      
      const planPreferences = {
        fitnessLevel: preferences.fitnessLevel || user?.fitnessLevel || 1,
        goals: preferences.goals || (user?.goals ? user.goals.split(',') : ['general_fitness']),
        timeAvailable: preferences.timeAvailable || 45,
        equipment: preferences.equipment || ['bodyweight', 'dumbbells'],
        injuries: preferences.injuries || []
      };

      // Generate plan using AI
      const aiPlan = await generateWorkoutPlan(planPreferences);
      
      // Save the plan to database
      const planData: any = {
        userId,
        name: aiPlan.name,
        description: aiPlan.description,
        difficulty: String(aiPlan.difficulty) as any,
        isActive: true
      };
      
      const savedPlan = await storage.createWorkoutPlan(planData);
      
      // Save exercises
      const savedExercises = [];
      for (const exercise of aiPlan.exercises) {
        const exerciseData: any = {
          planId: savedPlan.id,
          name: exercise.name,
          description: exercise.description,
          type: exercise.type,
          difficulty: exercise.difficulty,
          targetMuscles: exercise.targetMuscles.join(','),
          day: exercise.day,
          order: exercise.order,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration
        };
        
        const savedExercise = await storage.createExercise(exerciseData);
        savedExercises.push(savedExercise);
      }
      
      return {
        ...savedPlan,
        exercises: savedExercises
      };
    } catch (error) {
      console.error("Error generating personalized plan:", error);
      throw new Error("Failed to generate personalized workout plan: " + (error as Error).message);
    }
  }

  async adaptPlanToProficiency(planId: number, userId: string, proficiencyData: {
    exerciseScores: { [exerciseName: string]: number };
    overallPerformance: number;
  }): Promise<any> {
    try {
      const plan = await storage.getWorkoutPlan(planId, userId);
      if (!plan) {
        throw new Error("Workout plan not found");
      }

      const exercises = await storage.getExercisesByPlan(planId);
      
      // Adapt exercises based on proficiency
      for (const exercise of exercises) {
        const exerciseScore = proficiencyData.exerciseScores[exercise.name] || proficiencyData.overallPerformance;
        
        let adaptedExercise = { ...exercise };
        
        if (exerciseScore >= 85) {
          // Increase difficulty for high performers
          adaptedExercise.difficulty = Math.min(5, exercise.difficulty + 1);
          if (exercise.sets) adaptedExercise.sets = Math.min(6, exercise.sets + 1);
          if (exercise.reps) adaptedExercise.reps = Math.min(20, Math.floor(exercise.reps * 1.2));
        } else if (exerciseScore <= 60) {
          // Decrease difficulty for struggling users
          adaptedExercise.difficulty = Math.max(1, exercise.difficulty - 1);
          if (exercise.sets) adaptedExercise.sets = Math.max(1, exercise.sets - 1);
          if (exercise.reps) adaptedExercise.reps = Math.max(5, Math.floor(exercise.reps * 0.8));
        }
        
        await storage.updateExercise(exercise.id, adaptedExercise);
      }
      
      return await storage.getWorkoutPlan(planId, userId);
    } catch (error) {
      console.error("Error adapting plan to proficiency:", error);
      throw new Error("Failed to adapt workout plan: " + (error as Error).message);
    }
  }

  async generateProgressionPlan(userId: string, currentPlanId: number): Promise<any> {
    try {
      const currentPlan = await storage.getWorkoutPlan(currentPlanId, userId);
      if (!currentPlan) {
        throw new Error("Current workout plan not found");
      }

      const currentExercises = await storage.getExercisesByPlan(currentPlanId);
      const userStats = await storage.getUserStats(userId);
      
      // Create a progression plan with increased difficulty
      const progressionExercises = currentExercises.map(exercise => ({
        ...exercise,
        difficulty: Math.min(5, exercise.difficulty + 1),
        sets: exercise.sets ? Math.min(6, exercise.sets + 1) : exercise.sets,
        reps: exercise.reps ? Math.min(20, Math.floor(exercise.reps * 1.15)) : exercise.reps,
        duration: exercise.duration ? Math.min(60, Math.floor(exercise.duration * 1.1)) : exercise.duration
      }));

      const progressionPlanData: any = {
        userId,
        name: `${currentPlan.name} - Progression`,
        description: `Advanced version of ${currentPlan.name}`,
        difficulty: 'advanced' as any,
        isActive: false // User can activate when ready
      };

      const savedProgressionPlan = await storage.createWorkoutPlan(progressionPlanData);
      
      // Save progression exercises
      const savedProgressionExercises = [];
      for (const exercise of progressionExercises) {
        const exerciseData: any = {
          planId: savedProgressionPlan.id,
          name: exercise.name,
          description: exercise.description,
          type: exercise.type,
          difficulty: exercise.difficulty,
          targetMuscles: exercise.targetMuscles,
          day: exercise.day,
          order: exercise.order,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          weight: exercise.weight ? exercise.weight * 1.1 : exercise.weight
        };
        
        const savedExercise = await storage.createExercise(exerciseData);
        savedProgressionExercises.push(savedExercise);
      }
      
      return {
        ...savedProgressionPlan,
        exercises: savedProgressionExercises
      };
    } catch (error) {
      console.error("Error generating progression plan:", error);
      throw new Error("Failed to generate progression plan: " + (error as Error).message);
    }
  }

  async getRecommendedExercises(userId: string, targetMuscles: string[], difficulty: number): Promise<any[]> {
    try {
      // In a real implementation, this would have a comprehensive exercise database
      // For now, we'll return some common exercises based on target muscles
      
      const exerciseDatabase = {
        chest: [
          { name: "Push-ups", type: "strength", difficulty: 2, description: "Classic bodyweight chest exercise" },
          { name: "Bench Press", type: "strength", difficulty: 3, description: "Compound chest exercise with weights" },
          { name: "Chest Flyes", type: "strength", difficulty: 2, description: "Isolation exercise for chest development" }
        ],
        back: [
          { name: "Pull-ups", type: "strength", difficulty: 4, description: "Upper body pulling exercise" },
          { name: "Bent-over Rows", type: "strength", difficulty: 3, description: "Back strengthening exercise" },
          { name: "Lat Pulldowns", type: "strength", difficulty: 2, description: "Lat-focused pulling exercise" }
        ],
        legs: [
          { name: "Squats", type: "strength", difficulty: 2, description: "Fundamental lower body exercise" },
          { name: "Lunges", type: "strength", difficulty: 2, description: "Single-leg strengthening exercise" },
          { name: "Deadlifts", type: "strength", difficulty: 4, description: "Full-body compound movement" }
        ],
        core: [
          { name: "Plank", type: "strength", difficulty: 1, description: "Isometric core strengthening" },
          { name: "Bicycle Crunches", type: "strength", difficulty: 2, description: "Dynamic core exercise" },
          { name: "Russian Twists", type: "strength", difficulty: 2, description: "Rotational core movement" }
        ],
        cardio: [
          { name: "Running", type: "cardio", difficulty: 2, description: "Aerobic endurance exercise" },
          { name: "Jump Rope", type: "cardio", difficulty: 3, description: "High-intensity cardio workout" },
          { name: "Burpees", type: "cardio", difficulty: 4, description: "Full-body cardio exercise" }
        ]
      };

      let recommendedExercises: any[] = [];
      
      targetMuscles.forEach(muscle => {
        const muscleExercises = exerciseDatabase[muscle as keyof typeof exerciseDatabase] || [];
        const filteredExercises = muscleExercises.filter(ex => 
          Math.abs(ex.difficulty - difficulty) <= 1
        );
        recommendedExercises.push(...filteredExercises);
      });

      // Remove duplicates and limit results
      const uniqueExercises = recommendedExercises.filter((exercise, index, self) =>
        index === self.findIndex(ex => ex.name === exercise.name)
      ).slice(0, 10);

      return uniqueExercises;
    } catch (error) {
      console.error("Error getting recommended exercises:", error);
      throw new Error("Failed to get recommended exercises: " + (error as Error).message);
    }
  }
}

export const workoutGeneratorService = new WorkoutGeneratorService();
