import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { workoutService } from "@/services/workouts";
import NavigationSidebar from "@/components/NavigationSidebar";
import WebcamCapture from "@/components/WebcamCapture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Video, Brain, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

export default function MovementAnalysis() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisStep, setAnalysisStep] = useState<"select" | "capture" | "results">("select");

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

  const { data: movementAnalyses, error } = useQuery({
    queryKey: ["/api/movement-analysis"],
    queryFn: () => workoutService.getMovementAnalyses(10),
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

  const analyzeMutation = useMutation({
    mutationFn: workoutService.analyzeMovement,
    onSuccess: (result) => {
      setAnalysisResult(result);
      setAnalysisStep("results");
      toast({
        title: "Analysis Complete",
        description: "Your movement has been analyzed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/movement-analysis"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze movement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVideoCapture = (videoData: string) => {
    if (!selectedExercise) {
      toast({
        title: "No Exercise Selected",
        description: "Please select an exercise before recording.",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate({
      exerciseName: selectedExercise,
      videoData,
    });
  };

  const getFormScoreColor = (score: number) => {
    if (score >= 85) return "form-score-excellent";
    if (score >= 70) return "form-score-good";
    return "form-score-needs-improvement";
  };

  const getFormScoreIcon = (score: number) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return TrendingUp;
    return AlertCircle;
  };

  const exercises = [
    "Push-ups",
    "Squats", 
    "Lunges",
    "Plank",
    "Burpees",
    "Jumping Jacks",
    "Mountain Climbers",
    "Dead Bugs",
    "Glute Bridges",
    "High Knees"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavigationSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
          <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">AI Movement Analysis</h1>
              <p className="mt-1 text-gray-600">Get real-time feedback on your exercise form and technique</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Analysis Area */}
              <div className="lg:col-span-2">
                {analysisStep === "select" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Video className="mr-2 h-5 w-5" />
                        Select Exercise
                      </CardTitle>
                      <CardDescription>
                        Choose the exercise you want to analyze and we'll provide real-time form feedback
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an exercise to analyze" />
                          </SelectTrigger>
                          <SelectContent>
                            {exercises.map((exercise) => (
                              <SelectItem key={exercise} value={exercise}>
                                {exercise}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedExercise && (
                          <div className="flex justify-center">
                            <Button 
                              onClick={() => setAnalysisStep("capture")}
                              className="bg-primary-600 hover:bg-primary-700"
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Start Camera
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysisStep === "capture" && (
                  <WebcamCapture 
                    exerciseName={selectedExercise}
                    onVideoCapture={handleVideoCapture}
                    isAnalyzing={analyzeMutation.isPending}
                  />
                )}

                {analysisStep === "results" && analysisResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="mr-2 h-5 w-5" />
                        Analysis Results for {selectedExercise}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Form Score */}
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 text-3xl font-bold ${getFormScoreColor(analysisResult.formScore)}`}>
                          {analysisResult.formScore}
                        </div>
                        <p className="mt-2 text-lg font-medium">Form Score</p>
                        <Progress value={analysisResult.formScore} className="mt-2" />
                      </div>

                      {/* Overall Feedback */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Overall Feedback</h4>
                        <p className="text-gray-700">{analysisResult.feedback}</p>
                      </div>

                      {/* Corrections */}
                      {analysisResult.corrections && analysisResult.corrections.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Areas for Improvement</h4>
                          <ul className="space-y-2">
                            {analysisResult.corrections.map((correction: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <AlertCircle className="mr-2 h-4 w-4 text-accent-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{correction}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Strengths */}
                      {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Strengths</h4>
                          <ul className="space-y-2">
                            {analysisResult.strengths.map((strength: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="mr-2 h-4 w-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-center space-x-4">
                        <Button 
                          onClick={() => {
                            setAnalysisStep("select");
                            setAnalysisResult(null);
                            setSelectedExercise("");
                          }}
                          variant="outline"
                        >
                          Analyze Another Exercise
                        </Button>
                        <Button 
                          onClick={() => setAnalysisStep("capture")}
                          className="bg-primary-600 hover:bg-primary-700"
                        >
                          Try Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - Recent Analyses */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Analyses</CardTitle>
                    <CardDescription>Your latest movement analysis results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {movementAnalyses && movementAnalyses.length > 0 ? (
                      <div className="space-y-4">
                        {movementAnalyses.slice(0, 5).map((analysis: any) => {
                          const ScoreIcon = getFormScoreIcon(analysis.formScore);
                          return (
                            <div key={analysis.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-sm">{analysis.exerciseName}</h5>
                                <Badge variant={analysis.formScore >= 85 ? "default" : analysis.formScore >= 70 ? "secondary" : "destructive"}>
                                  {analysis.formScore}
                                </Badge>
                              </div>
                              <div className="flex items-center text-xs text-gray-600">
                                <ScoreIcon className="mr-1 h-3 w-3" />
                                <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Brain className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">No analyses yet</p>
                        <p className="text-xs text-gray-500">Start analyzing your form to see results here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* How It Works */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-3">
                      <li className="flex items-start">
                        <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">1</span>
                        <span>Select the exercise you want to perform</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">2</span>
                        <span>Position yourself in front of the camera</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">3</span>
                        <span>Record yourself performing the exercise</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary-100 text-primary-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">4</span>
                        <span>Get AI-powered feedback on your form</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
