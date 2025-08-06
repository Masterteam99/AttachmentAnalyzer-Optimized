export interface QuestionnaireQuestion {
  id: string;
  type: "info" | "single_choice" | "multi_choice";
  label?: string;
  text?: string;
  options?: string[];
  required?: boolean;
}

export interface QuestionnaireResponse {
  questionId: string;
  answer: string | string[];
}

export interface CompletedQuestionnaire {
  type: string;
  responses: QuestionnaireResponse[];
  completedAt: Date;
}

// Fitness Onboarding Questionnaire
export const fitnessOnboardingQuestionnaire: QuestionnaireQuestion[] = [
  {
    id: "welcome_message",
    type: "info",
    text: "Benvenuto/a! Rispondere a poche domande ci aiuterà a creare un piano di allenamento su misura per te. Ci vorranno solo 2 minuti."
  },
  {
    id: "goal",
    type: "single_choice",
    label: "Qual è il tuo obiettivo principale?",
    options: ["Dimagrire", "Aumentare la massa muscolare", "Tonificare il corpo", "Migliorare la mobilità", "Mantenerti in forma"],
    required: true
  },
  {
    id: "experience",
    type: "single_choice",
    label: "Hai già esperienza con l'allenamento?",
    options: ["Sono principiante", "Mi alleno da un po'", "Sono molto esperto/a"],
    required: true
  },
  {
    id: "training_location",
    type: "single_choice",
    label: "Dove ti alleni di solito?",
    options: ["A casa", "In palestra", "All'aperto"],
    required: true
  },
  {
    id: "equipment",
    type: "multi_choice",
    label: "Quale attrezzatura hai a disposizione?",
    options: ["Nessuna", "Pesi liberi (manubri)", "Elastici", "Panca", "Sbarra per trazioni", "Tappetino"],
    required: true
  },
  {
    id: "availability",
    type: "single_choice",
    label: "Quanti giorni alla settimana puoi allenarti?",
    options: ["1 giorno", "2-3 giorni", "4-5 giorni", "Tutti i giorni"],
    required: true
  },
  {
    id: "session_time",
    type: "single_choice",
    label: "Quanto tempo puoi dedicare ad ogni allenamento?",
    options: ["15 minuti", "30 minuti", "45 minuti", "1 ora o più"],
    required: true
  },
  {
    id: "focus_area",
    type: "multi_choice",
    label: "C'è una zona del corpo su cui vuoi concentrarti?",
    options: ["No, voglio allenare tutto il corpo", "Parte superiore (braccia, petto, spalle)", "Parte inferiore (gambe, glutei)", "Addome e core", "Schiena", "Flessibilità e mobilità"],
    required: true
  },
  {
    id: "limitations",
    type: "multi_choice",
    label: "Hai limitazioni fisiche o movimenti da evitare?",
    options: ["No", "Problemi alle ginocchia", "Problemi alla schiena", "Problemi alle spalle", "Altro (specificare)"],
    required: true
  },
  {
    id: "plan_style",
    type: "single_choice",
    label: "Preferisci un piano...",
    options: ["Strutturato giorno per giorno", "Flessibile, da scegliere ogni giorno", "Non so, consigliatemi voi"],
    required: true
  },
  {
    id: "end_message",
    type: "info",
    text: "Grazie per aver risposto! Il tuo piano personalizzato è pronto. Puoi modificarlo in qualsiasi momento dal tuo profilo."
  }
];

// Helper function to analyze questionnaire responses
export function analyzeQuestionnaireResponses(responses: QuestionnaireResponse[]) {
  const responseMap = new Map(responses.map(r => [r.questionId, r.answer]));
  
  // Determine fitness level based on experience
  const experience = responseMap.get("experience") as string;
  let fitnessLevel = 1;
  if (experience === "Mi alleno da un po'") fitnessLevel = 2;
  if (experience === "Sono molto esperto/a") fitnessLevel = 3;
  
  // Extract goals
  const mainGoal = responseMap.get("goal") as string;
  const focusAreas = responseMap.get("focus_area") as string[];
  const goals = [mainGoal, ...(focusAreas || [])].filter(Boolean);
  
  // Determine training preferences
  const location = responseMap.get("training_location") as string;
  const equipment = responseMap.get("equipment") as string[];
  const availability = responseMap.get("availability") as string;
  const sessionTime = responseMap.get("session_time") as string;
  
  // Extract limitations
  const limitations = responseMap.get("limitations") as string[];
  const injuries = limitations?.filter(l => l !== "No") || [];
  
  return {
    fitnessLevel,
    goals: goals.join(", "),
    preferences: {
      location,
      equipment: equipment?.join(", ") || "Nessuna",
      availability,
      sessionTime,
      planStyle: responseMap.get("plan_style") as string
    },
    injuries: injuries.join(", ") || "Nessuna",
    responses: responseMap
  };
}
