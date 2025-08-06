import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import WorkoutPlans from "./pages/WorkoutPlans";
import MovementAnalysis from "./pages/MovementAnalysis";
import Achievements from "./pages/Achievements";
import Wearables from "./pages/Wearables";
import Subscription from "./pages/Subscription";
import DailyWorkout from "./pages/DailyWorkout";
import AdaptivePlans from "@/pages/AdaptivePlans";
import ProfessionalExercises from "@/pages/ProfessionalExercises";
import Onboarding from "@/pages/Onboarding";
import { ErrorHandlingDemo } from "@/components/ErrorHandlingDemo";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/daily-workout" component={DailyWorkout} />
          <Route path="/workout-plans" component={WorkoutPlans} />
          <Route path="/adaptive-plans" component={AdaptivePlans} />
          <Route path="/professional-exercises" component={ProfessionalExercises} />
          <Route path="/movement-analysis" component={MovementAnalysis} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/wearables" component={Wearables} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/error-demo" component={ErrorHandlingDemo} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NetworkStatus />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
