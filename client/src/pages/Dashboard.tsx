import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStatus } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import NavigationSidebar from "@/components/NavigationSidebar";
import DashboardStats from "@/components/DashboardStats";
import AdvancedDashboard from "@/components/AdvancedDashboard";
import { AIInsightsDashboard } from "@/components/AIInsightsDashboard";
import ProgressChart from "@/components/ProgressChart";
import RecentWorkouts from "@/components/RecentWorkouts";
import AchievementCard from "@/components/AchievementCard";
import HealthMetrics from "@/components/HealthMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Play, Video, Target, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { needsOnboarding, isLoading: isOnboardingLoading } = useOnboardingStatus();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Show onboarding notice if needed
  if (!isLoading && !isOnboardingLoading && needsOnboarding) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavigationSidebar />
        
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="p-8">
              <CardHeader>
                <Target className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Configura il tuo profilo</CardTitle>
                <CardDescription className="text-lg">
                  Per iniziare, completa la configurazione del tuo profilo fitness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Rispondi ad alcune domande per ricevere un piano di allenamento 
                  personalizzato e iniziare il tuo percorso fitness.
                </p>
                <Link href="/onboarding">
                  <Button size="lg" className="w-full">
                    Inizia Configurazione
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const { data: dashboardData, isLoading: isDashboardLoading, error } = useQuery<{
    stats: any;
    recentSessions: any[];
    recentAchievements: any[];
    recentHealthData: any[];
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

    // Fetch dashboard analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/dashboard/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/analytics', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch analytics');
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    }
  });

  // Fetch AI insights
  const { data: aiInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/ai-insights', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/ai-insights/${user?.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch AI insights');
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!user?.id,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
    refetchInterval: 30000 // Refresh insights every 30 seconds
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const startWorkout = () => {
    // In a real implementation, this would open a workout selection modal
    toast({
      title: "Feature Coming Soon",
      description: "Workout selection modal will be implemented",
    });
  };

  const startMovementAnalysis = () => {
    window.location.href = "/movement-analysis";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigationSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Play className="text-white text-sm" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">FitTracker Pro</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-8">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Welcome back, {user?.firstName || 'User'}! 👋
                  </h1>
                  <p className="mt-1 text-gray-600">Here's your fitness progress overview</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button 
                    onClick={startWorkout}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Workout
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Analytics Dashboard */}
            <AdvancedDashboard data={analyticsData} isLoading={analyticsLoading} />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <Link href="/daily-workout">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Play className="text-primary-600 h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">Allenamento Giornaliero</h3>
                        <p className="text-sm text-gray-600">Inizia il tuo workout di oggi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/movement-analysis">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Video className="text-blue-600 h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">Analisi Movimento</h3>
                        <p className="text-sm text-gray-600">Analizza la tua tecnica con IA</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/achievements">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Brain className="text-yellow-600 h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">Risultati</h3>
                        <p className="text-sm text-gray-600">Visualizza i tuoi progressi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* Left Column - Progress & Activity */}
              <div className="lg:col-span-2 space-y-8">
                <ProgressChart data={dashboardData?.stats} />
                <RecentWorkouts sessions={dashboardData?.recentSessions || []} />
              </div>

              {/* Right Column - Achievements & Quick Actions */}
              <div className="space-y-8">
                {/* Achievement Highlights */}
                <AchievementCard achievements={dashboardData?.recentAchievements || []} />

                {/* AI Movement Analysis Card */}
                <Card className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <Brain className="text-white h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg ml-3">AI Analysis</CardTitle>
                    </div>
                    <CardDescription className="text-blue-100">
                      Get real-time feedback on your form and technique using our advanced AI movement analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={startMovementAnalysis}
                      className="bg-white text-primary-600 hover:bg-gray-50 w-full"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Start Analysis
                    </Button>
                  </CardContent>
                </Card>

                {/* Health Data from Wearables */}
                <HealthMetrics data={dashboardData?.recentHealthData || []} />

                {/* Subscription Status */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle>Subscription</CardTitle>
                      <span className="px-3 py-1 bg-secondary-100 text-secondary-800 text-sm font-medium rounded-full">
                        {user?.subscriptionStatus === 'active' ? 'Premium' : 'Free'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-crown text-white text-xl"></i>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {user?.subscriptionStatus === 'active' 
                          ? 'Premium features active' 
                          : 'Upgrade to unlock all features'
                        }
                      </p>
                      <Link href="/subscription">
                        <Button variant="outline" size="sm">
                          {user?.subscriptionStatus === 'active' ? 'Manage Subscription' : 'Upgrade Now'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions Floating Bar - Mobile Only */}
            <div className="fixed bottom-6 right-6 lg:hidden">
              <Button 
                onClick={startWorkout}
                className="bg-primary-600 hover:bg-primary-700 text-white w-14 h-14 rounded-full shadow-lg"
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
