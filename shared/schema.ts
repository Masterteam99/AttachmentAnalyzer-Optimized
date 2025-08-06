import {
  sqliteTable,
  text,
  integer,
  index,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON as text in SQLite
    expire: integer("expire", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  fitnessLevel: integer("fitness_level").default(1),
  goals: text("goals"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const workoutPlans = sqliteTable("workout_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  difficulty: integer("difficulty").default(1),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull().references(() => workoutPlans.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // strength, cardio, flexibility
  difficulty: integer("difficulty").default(1),
  targetMuscles: text("target_muscles"),
  day: integer("day").notNull(),
  order: integer("order").notNull(),
  duration: integer("duration"), // in minutes
  sets: integer("sets"),
  reps: integer("reps"),
  weight: real("weight"),
});

// Exercise templates with reference videos and biomechanical rules
export const exerciseTemplates = sqliteTable("exercise_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // squat, pushup, lunge, etc
  description: text("description"),
  referenceVideoUrl: text("reference_video_url"), // URL to professional execution video
  referenceVideoKeypoints: text("reference_video_keypoints"), // JSON as text
  difficulty: integer("difficulty").default(1),
  targetMuscles: text("target_muscles"), // JSON array as text
  equipment: text("equipment"), // JSON array as text
  instructions: text("instructions"), // JSON array as text
  commonMistakes: text("common_mistakes"), // JSON array as text
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Biomechanical rules for each exercise
export const biomechanicalRules = sqliteTable("biomechanical_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exerciseTemplateId: integer("exercise_template_id").notNull().references(() => exerciseTemplates.id),
  ruleName: text("rule_name").notNull(),
  description: text("description"),
  ruleType: text("rule_type").notNull(), // angle, distance, ratio, sequence
  bodyParts: text("body_parts"), // JSON array as text
  minValue: real("min_value"),
  maxValue: real("max_value"),
  severity: text("severity").default("medium"), // low, medium, high, critical
  correctionFeedback: text("correction_feedback"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

// Corrective feedback templates
export const correctiveFeedback = sqliteTable("corrective_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exerciseTemplateId: integer("exercise_template_id").notNull().references(() => exerciseTemplates.id),
  violatedRule: text("violated_rule"),
  feedbackType: text("feedback_type").notNull(), // form, breathing, tempo, range_of_motion
  message: text("message").notNull(),
  priority: integer("priority").default(1), // 1-5, higher = more important
  videoExample: text("video_example"), // URL to corrective demonstration
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").references(() => workoutPlans.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  duration: integer("duration").notNull(), // in minutes
  caloriesBurned: integer("calories_burned"),
  intensity: text("intensity"), // low, medium, high
  completedAt: integer("completed_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // streak, perfectionist, explorer
  title: text("title").notNull(),
  description: text("description"),
  earnedAt: integer("earned_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const userStats = sqliteTable("user_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalWorkouts: integer("total_workouts").default(0),
  totalCaloriesBurned: integer("total_calories_burned").default(0),
  weeklyGoal: integer("weekly_goal").default(4),
  weeklyProgress: integer("weekly_progress").default(0),
  lastWorkoutDate: integer("last_workout_date", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const wearableIntegrations = sqliteTable("wearable_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // fitbit, garmin, etc
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  lastSync: integer("last_sync", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const healthData = sqliteTable("health_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  dataType: text("data_type").notNull(), // heart_rate, steps, sleep, etc
  value: real("value").notNull(),
  unit: text("unit"),
  source: text("source"), // fitbit, manual, etc
  recordedAt: integer("recorded_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const movementAnalysis = sqliteTable("movement_analysis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  sessionId: text("session_id"), // Changed to text to match actual DB structure
  exerciseName: text("exercise_name").notNull(),
  videoData: text("video_data"), // base64 or file path
  analysisResult: text("analysis_result").notNull(), // JSON as text
  confidenceScore: real("confidence_score").default(0), // Match actual DB structure
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// User Questionnaires table - IMPORTANTE per il flusso preliminare
export const userQuestionnaires = sqliteTable("user_questionnaires", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  questionnaireType: text("questionnaire_type").notNull().default("fitness_onboarding"),
  responses: text("responses").notNull(), // JSON as text - Store all Q&A responses
  completedAt: integer("completed_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workoutPlans: many(workoutPlans),
  workoutSessions: many(workoutSessions),
  achievements: many(achievements),
  userStats: many(userStats),
  wearableIntegrations: many(wearableIntegrations),
  healthData: many(healthData),
  movementAnalysis: many(movementAnalysis),
  userQuestionnaires: many(userQuestionnaires),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutPlans.userId],
    references: [users.id],
  }),
  exercises: many(exercises),
  workoutSessions: many(workoutSessions),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  workoutPlan: one(workoutPlans, {
    fields: [exercises.planId],
    references: [workoutPlans.id],
  }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutSessions.userId],
    references: [users.id],
  }),
  workoutPlan: one(workoutPlans, {
    fields: [workoutSessions.planId],
    references: [workoutPlans.id],
  }),
  movementAnalysis: many(movementAnalysis),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const wearableIntegrationsRelations = relations(wearableIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [wearableIntegrations.userId],
    references: [users.id],
  }),
}));

export const healthDataRelations = relations(healthData, ({ one }) => ({
  user: one(users, {
    fields: [healthData.userId],
    references: [users.id],
  }),
}));

export const movementAnalysisRelations = relations(movementAnalysis, ({ one }) => ({
  user: one(users, {
    fields: [movementAnalysis.userId],
    references: [users.id],
  }),
  workoutSession: one(workoutSessions, {
    fields: [movementAnalysis.sessionId],
    references: [workoutSessions.id],
  }),
}));

// Relations per exerciseTemplates
export const exerciseTemplatesRelations = relations(exerciseTemplates, ({ many }) => ({
  biomechanicalRules: many(biomechanicalRules),
  correctiveFeedback: many(correctiveFeedback),
}));

export const biomechanicalRulesRelations = relations(biomechanicalRules, ({ one }) => ({
  exerciseTemplate: one(exerciseTemplates, {
    fields: [biomechanicalRules.exerciseTemplateId],
    references: [exerciseTemplates.id],
  }),
}));

export const correctiveFeedbackRelations = relations(correctiveFeedback, ({ one }) => ({
  exerciseTemplate: one(exerciseTemplates, {
    fields: [correctiveFeedback.exerciseTemplateId],
    references: [exerciseTemplates.id],
  }),
}));

// Relations per userQuestionnaires
export const userQuestionnairesRelations = relations(userQuestionnaires, ({ one }) => ({
  user: one(users, {
    fields: [userQuestionnaires.userId],
    references: [users.id],
  }),
}));

// Insert schemas - Using direct schema creation for better compatibility
export const insertUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

export const insertWorkoutPlanSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  exercises: z.array(z.any()),
  estimatedDuration: z.number(),
});

export const insertExerciseSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  muscleGroups: z.array(z.string()),
  equipment: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
});

export const insertWorkoutSessionSchema = z.object({
  userId: z.string(),
  workoutPlanId: z.string().optional(),
  exercises: z.array(z.any()),
  duration: z.number(),
  caloriesBurned: z.number().optional(),
  notes: z.string().optional(),
});

export const insertAchievementSchema = z.object({
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number(),
  badgeUrl: z.string().optional(),
});

export const insertMovementAnalysisSchema = z.object({
  userId: z.string(),
  exerciseName: z.string(),
  videoUrl: z.string().optional(),
  keypoints: z.array(z.any()),
  formScore: z.number(),
  feedback: z.string(),
  corrections: z.array(z.string()),
  strengths: z.array(z.string()),
});

export const insertUserQuestionnaireSchema = createInsertSchema(userQuestionnaires);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = z.infer<typeof insertWorkoutPlanSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type WearableIntegration = typeof wearableIntegrations.$inferSelect;
export type HealthData = typeof healthData.$inferSelect;
export type MovementAnalysis = typeof movementAnalysis.$inferSelect;
export type InsertMovementAnalysis = z.infer<typeof insertMovementAnalysisSchema>;
export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;
export type InsertExerciseTemplate = typeof exerciseTemplates.$inferInsert;
export type BiomechanicalRule = typeof biomechanicalRules.$inferSelect;  
export type InsertBiomechanicalRule = typeof biomechanicalRules.$inferInsert;
export type CorrectiveFeedback = typeof correctiveFeedback.$inferSelect;
export type InsertCorrectiveFeedback = typeof correctiveFeedback.$inferInsert;
export type UserQuestionnaire = typeof userQuestionnaires.$inferSelect;
export type InsertUserQuestionnaire = z.infer<typeof insertUserQuestionnaireSchema>;
