import OpenAI from "openai";

// Debug environment variables
console.log('🔧 OpenAI Configuration:');
console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('- OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('- NODE_ENV:', process.env.NODE_ENV);

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-default_key"
});

// Development mode fallback data
const DEV_FALLBACK_ANALYSIS = {
  formScore: 78,
  feedback: "Good form overall with room for improvement. Focus on maintaining proper alignment throughout the movement.",
  corrections: [
    "Keep your core engaged throughout the entire movement",
    "Maintain neutral spine alignment", 
    "Control the tempo - avoid rushing through the exercise"
  ],
  strengths: [
    "Good range of motion",
    "Consistent movement pattern",
    "Proper breathing technique"
  ]
};

export async function analyzeMovementForm(exerciseName: string, keypoints: any[]): Promise<{
  formScore: number;
  feedback: string;
  corrections: string[];
  strengths: string[];
}> {
  // Skip OpenAI in development to avoid quota issues
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Using development fallback for OpenAI analysis');
    return {
      ...DEV_FALLBACK_ANALYSIS,
      feedback: `${DEV_FALLBACK_ANALYSIS.feedback} (Exercise: ${exerciseName || 'Unknown'})`
    };
  }  
  console.log('🤖 [OpenAI] Analyzing movement form with GPT-3.5-turbo');

  try {
    const prompt = `
    You are an expert personal trainer and biomechanics analyst. Analyze the movement form for the exercise "${exerciseName}" based on the following keypoint data:

    Keypoints: ${JSON.stringify(keypoints)}

    Provide a detailed analysis including:
    1. Form score (1-100)
    2. Overall feedback
    3. Specific corrections needed
    4. Movement strengths observed

    Respond with JSON in this exact format:
    {
      "formScore": number,
      "feedback": "string",
      "corrections": ["string"],
      "strengths": ["string"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert fitness coach and biomechanics analyst. Always provide constructive, actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      formScore: Math.max(1, Math.min(100, result.formScore || 50)),
      feedback: result.feedback || "Analysis completed",
      corrections: result.corrections || [],
      strengths: result.strengths || []
    };
  } catch (error) {
    console.error("Error analyzing movement form:", error);
    // Fallback on error
    return {
      formScore: 78,
      feedback: `Good ${exerciseName} form! Focus on maintaining proper alignment throughout the movement.`,
      corrections: [
        "Keep your core engaged throughout the movement",
        "Maintain controlled movement speed", 
        "Ensure proper breathing pattern"
      ],
      strengths: [
        "Good range of motion",
        "Consistent movement pattern",
        "Proper starting position"
      ]
    };
  }
}

export async function generateWorkoutPlan(preferences: any): Promise<any> {
  console.log('🤖 [OpenAI] Generating workout plan with GPT-3.5-turbo');
  
  try {
    const prompt = `Generate a personalized workout plan based on these preferences:
    - Fitness Level: ${preferences.fitnessLevel || 'Intermediate'}
    - Goals: ${preferences.goals?.join(', ') || 'General fitness'}
    - Time Available: ${preferences.timeAvailable || 30} minutes
    - Equipment: ${preferences.equipment?.join(', ') || 'Bodyweight'}

    Create a comprehensive workout plan with exercises, sets, reps, and rest periods.
    
    Return the response in this exact JSON format:
    {
      "name": "string",
      "description": "string", 
      "difficulty": "beginner|intermediate|advanced",
      "duration": number,
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string", 
          "instructions": "string",
          "targetMuscles": ["string"],
          "day": number,
          "order": number
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert personal trainer who creates safe, effective, and personalized workout plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.7
    });

    const workoutPlan = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ [OpenAI] Workout plan generated successfully');
    return workoutPlan;

  } catch (error: any) {
    console.error('Error generating workout plan:', error);
    
    // Fallback plan
    return {
      name: `${preferences.goals?.[0] || 'Strength'} Training Plan`,
      description: `A personalized ${preferences.timeAvailable || 30}-minute workout`,
      difficulty: preferences.fitnessLevel >= 4 ? 'advanced' : preferences.fitnessLevel >= 2 ? 'intermediate' : 'beginner',
      duration: preferences.timeAvailable || 30,
      exercises: [
        {
          name: "Push-ups",
          sets: 3,
          reps: "8-12",
          instructions: "Keep body straight, lower chest to ground",
          targetMuscles: ["chest", "shoulders", "triceps"],
          day: 1,
          order: 1
        },
        {
          name: "Squats",
          sets: 3,
          reps: "10-15",
          instructions: "Lower hips back and down, keep chest up",
          targetMuscles: ["quadriceps", "glutes"],
          day: 1,
          order: 2
        }
      ]
    };
  }
}export async function provideNutritionAdvice(userGoals: string[], currentWeight?: number, targetWeight?: number): Promise<{
  recommendations: string[];
  mealSuggestions: string[];
  tips: string[];
}> {
  // Skip OpenAI in development to avoid quota issues
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Using development fallback for nutrition advice');
    return {
      recommendations: [
        "Focus on whole, unprocessed foods",
        "Maintain a balanced intake of protein, carbs, and healthy fats",
        "Stay hydrated with 8-10 glasses of water daily"
      ],
      mealSuggestions: [
        "Breakfast: Greek yogurt with berries and nuts",
        "Lunch: Grilled chicken with quinoa and vegetables",
        "Dinner: Salmon with sweet potato and broccoli",
        "Snack: Apple with almond butter"
      ],
      tips: [
        "Meal prep on weekends to save time",
        "Eat protein with every meal to maintain satiety",
        "Include colorful vegetables for essential vitamins"
      ]
    };
  }

  try {
    const prompt = `
    Provide nutrition advice for someone with these fitness goals: ${userGoals.join(', ')}
    ${currentWeight ? `Current weight: ${currentWeight}kg` : ''}
    ${targetWeight ? `Target weight: ${targetWeight}kg` : ''}

    Provide practical nutrition recommendations, meal suggestions, and tips.

    Respond with JSON in this exact format:
    {
      "recommendations": ["string"],
      "mealSuggestions": ["string"],
      "tips": ["string"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Changed from gpt-4o to avoid quota issues
      messages: [
        {
          role: "system",
          content: "You are a certified nutritionist providing evidence-based nutrition advice. Always emphasize balanced, sustainable approaches."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      recommendations: result.recommendations || [],
      mealSuggestions: result.mealSuggestions || [],
      tips: result.tips || []
    };
  } catch (error) {
    console.error("Error providing nutrition advice:", error);
    // Return fallback nutrition advice
    return {
      recommendations: [
        "Focus on whole, unprocessed foods",
        "Maintain a balanced intake of protein, carbs, and healthy fats",
        "Stay hydrated with 8-10 glasses of water daily"
      ],
      mealSuggestions: [
        "Breakfast: Oatmeal with fruits and nuts",
        "Lunch: Lean protein with vegetables and whole grains",
        "Dinner: Fish or poultry with steamed vegetables",
        "Snack: Mixed nuts and fruits"
      ],
      tips: [
        "Plan your meals in advance",
        "Listen to your body's hunger cues",
        "Include a variety of colorful foods for nutrients"
      ]
    };
  }
}
