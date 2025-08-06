import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { achievementService } from "@/services/achievements";
import NavigationSidebar from "@/components/NavigationSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Target, Star, Award, Medal, Crown, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Achievements() {
  const { isAuthenticated, isLoading } = useAuth();
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

  const { data: achievements, isLoading: isAchievementsLoading, error } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: achievementService.getAchievements,
    enabled: isAuthenticated,
    retry: false,
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

  const getAchievementIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "streak":
        return Flame;
      case "perfectionist":
        return Target;
      case "explorer":
        return Star;
      case "milestone":
        return Medal;
      case "consistency":
        return Award;
      case "improvement":
        return Zap;
      default:
        return Trophy;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "streak":
        return "from-red-500 to-orange-500";
      case "perfectionist":
        return "from-blue-500 to-purple-500";
      case "explorer":
        return "from-purple-500 to-pink-500";
      case "milestone":
        return "from-yellow-500 to-orange-500";
      case "consistency":
        return "from-green-500 to-blue-500";
      case "improvement":
        return "from-indigo-500 to-purple-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case "streak":
        return "destructive";
      case "perfectionist":
        return "default";
      case "explorer":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading || isAchievementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const groupedAchievements = achievements?.reduce((acc: any, achievement: any) => {
    if (!acc[achievement.type]) {
      acc[achievement.type] = [];
    }
    acc[achievement.type].push(achievement);
    return acc;
  }, {}) || {};

  const achievementCategories = [
    { 
      type: "streak", 
      title: "Streak Achievements", 
      description: "Keep your workout momentum going",
      icon: Flame,
      color: "text-red-500"
    },
    { 
      type: "perfectionist", 
      title: "Form Master", 
      description: "Perfect your exercise technique",
      icon: Target,
      color: "text-blue-500"
    },
    { 
      type: "explorer", 
      title: "Exercise Explorer", 
      description: "Try new exercises and challenges",
      icon: Star,
      color: "text-purple-500"
    },
    { 
      type: "milestone", 
      title: "Milestones", 
      description: "Reach significant fitness goals",
      icon: Medal,
      color: "text-yellow-500"
    },
    { 
      type: "consistency", 
      title: "Consistency Awards", 
      description: "Maintain regular workout habits",
      icon: Award,
      color: "text-green-500"
    },
    { 
      type: "improvement", 
      title: "Progress Recognition", 
      description: "Show measurable improvement",
      icon: Zap,
      color: "text-indigo-500"
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigationSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
          <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Achievements</h1>
              <p className="mt-1 text-gray-600">
                Track your fitness milestones and celebrate your progress
              </p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    {achievements?.length || 0} achievements earned
                  </span>
                </div>
                <div className="flex items-center">
                  <Crown className="mr-2 h-5 w-5 text-purple-500" />
                  <span className="text-sm text-gray-600">
                    {Object.keys(groupedAchievements).length} categories unlocked
                  </span>
                </div>
              </div>
            </div>

            {/* Achievement Categories */}
            <div className="space-y-8">
              {achievementCategories.map((category) => {
                const CategoryIcon = category.icon;
                const categoryAchievements = groupedAchievements[category.type] || [];
                
                return (
                  <Card key={category.type} className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CategoryIcon className={`mr-3 h-6 w-6 ${category.color}`} />
                          <div>
                            <CardTitle>{category.title}</CardTitle>
                            <CardDescription>{category.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {categoryAchievements.length} earned
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {categoryAchievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryAchievements.map((achievement: any) => {
                            const AchievementIcon = getAchievementIcon(achievement.type);
                            return (
                              <div 
                                key={achievement.id}
                                className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAchievementColor(achievement.type)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                    <AchievementIcon className="text-white" size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <h4 className="font-semibold text-gray-900 truncate">
                                        {achievement.title}
                                      </h4>
                                      <Badge 
                                        variant={getBadgeVariant(achievement.type)}
                                        className="text-xs ml-2 flex-shrink-0"
                                      >
                                        {achievement.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {achievement.description}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                      Earned {formatDistanceToNow(new Date(achievement.earnedAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CategoryIcon className={`mx-auto h-12 w-12 ${category.color} opacity-50 mb-4`} />
                          <p className="text-gray-600">No achievements in this category yet</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Keep working out to unlock your first {category.title.toLowerCase()}!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Overall Achievement Summary */}
            {achievements && achievements.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Your Achievement Journey
                </h3>
                <p className="text-gray-600 mb-6">
                  Complete workouts, maintain streaks, and perfect your form to earn achievements.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <Flame className="mx-auto h-8 w-8 text-red-500 mb-2" />
                    <p className="text-sm font-medium">Build Streaks</p>
                    <p className="text-xs text-gray-500">Work out consistently</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <Target className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                    <p className="text-sm font-medium">Perfect Form</p>
                    <p className="text-xs text-gray-500">Improve exercise technique</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <Star className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                    <p className="text-sm font-medium">Explore Exercises</p>
                    <p className="text-xs text-gray-500">Try new workout types</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
