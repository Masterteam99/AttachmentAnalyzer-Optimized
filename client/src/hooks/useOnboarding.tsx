import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  latestQuestionnaire: any | null;
  needsOnboarding: boolean;
}

export interface OnboardingData {
  questionnaireType?: string;
  responses: Record<string, any>;
}

export interface OnboardingResult {
  success: boolean;
  message: string;
  data: {
    workoutPlan: any;
    exercises: any[];
    message: string;
  };
}

/**
 * Hook per gestire il sistema di onboarding integrato
 * Fornisce funzioni per verificare lo stato e completare l'onboarding
 */
export function useOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per verificare lo stato dell'onboarding
  const {
    data: onboardingStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    queryFn: async () => {
      const response = await fetch("/api/onboarding/status");
      if (!response.ok) {
        throw new Error("Errore nel recuperare lo stato dell'onboarding");
      }
      return response.json();
    },
  });

  // Mutation per completare l'onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData): Promise<OnboardingResult> => {
      console.log("🎯 Completamento onboarding:", data);
      
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante l'onboarding");
      }

      return response.json();
    },
    onSuccess: (result) => {
      console.log("✅ Onboarding completato con successo:", result);
      
      // Mostra toast di successo
      toast({
        title: "Benvenuto! 🎉",
        description: result.message,
        duration: 4000,
      });

      // Mostra dettagli del piano creato
      if (result.data?.workoutPlan) {
        setTimeout(() => {
          toast({
            title: `Piano "${result.data.workoutPlan.name}" Creato!`,
            description: `${result.data.exercises?.length || 0} esercizi personalizzati pronti per te.`,
            duration: 5000,
          });
        }, 2000);
      }

      // Invalida le query correlate per aggiornare la UI
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/questionnaires"] });
    },
    onError: (error) => {
      console.error("❌ Errore durante l'onboarding:", error);
      
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante la configurazione del profilo.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  return {
    // Stato
    onboardingStatus,
    isLoadingStatus,
    needsOnboarding: onboardingStatus?.needsOnboarding ?? true,
    hasCompletedOnboarding: onboardingStatus?.hasCompletedOnboarding ?? false,
    latestQuestionnaire: onboardingStatus?.latestQuestionnaire,
    
    // Azioni
    completeOnboarding: completeOnboardingMutation.mutate,
    isCompletingOnboarding: completeOnboardingMutation.isPending,
    onboardingError: completeOnboardingMutation.error,
    
    // Utility
    refetchStatus,
    reset: () => {
      completeOnboardingMutation.reset();
    }
  };
}

/**
 * Hook semplificato per verificare solo se l'utente ha bisogno dell'onboarding
 */
export function useOnboardingStatus() {
  const { data, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    queryFn: async () => {
      const response = await fetch("/api/onboarding/status");
      if (!response.ok) {
        throw new Error("Errore nel recuperare lo stato dell'onboarding");
      }
      return response.json();
    },
  });

  return {
    needsOnboarding: data?.needsOnboarding ?? true,
    hasCompletedOnboarding: data?.hasCompletedOnboarding ?? false,
    isLoading,
  };
}
