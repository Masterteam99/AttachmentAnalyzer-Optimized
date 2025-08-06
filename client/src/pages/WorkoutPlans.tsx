import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStatus } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import NavigationSidebar from "@/components/NavigationSidebar";
import GeneratedWorkoutPlans from "@/components/GeneratedWorkoutPlans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function WorkoutPlans() {
  const { isAuthenticated, isLoading } = useAuth();
  const { needsOnboarding, isLoading: isOnboardingLoading } = useOnboardingStatus();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Accesso richiesto",
        description: "Effettua l'accesso per continuare.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || isOnboardingLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavigationSidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
              <p>Caricamento piani di allenamento...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigationSidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              I Tuoi Piani di Allenamento
            </h1>
            <p className="text-gray-600">
              Piani personalizzati generati in base al tuo profilo fitness
            </p>
          </div>

          {/* Content */}
          {needsOnboarding ? (
            // Show onboarding prompt if user hasn't completed it
            <Card className="max-w-2xl mx-auto text-center">
              <CardHeader>
                <Target className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Crea il tuo primo piano</CardTitle>
                <CardDescription className="text-lg">
                  Completa la configurazione del tuo profilo per generare un piano di allenamento personalizzato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Rispondi ad alcune domande per ricevere un piano di allenamento 
                  specifico per i tuoi obiettivi, livello di fitness e attrezzatura disponibile.
                </p>
                <Link href="/onboarding">
                  <Button size="lg" className="w-full sm:w-auto">
                    Inizia Configurazione
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            // Show generated workout plans
            <GeneratedWorkoutPlans />
          )}
        </div>
      </main>
    </div>
  );
}
