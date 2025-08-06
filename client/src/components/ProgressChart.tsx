import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BarChart3 } from "lucide-react";

interface ProgressChartProps {
  data?: any;
}

export default function ProgressChart({ data }: ProgressChartProps) {
  const [timeframe, setTimeframe] = useState<"7days" | "30days">("7days");

  // In a real implementation, this would render actual chart data
  // For now, showing a placeholder that matches the design
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Weekly Progress</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={timeframe === "7days" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe("7days")}
              className={timeframe === "7days" ? "bg-primary-50 text-primary-700" : ""}
            >
              7 days
            </Button>
            <Button 
              variant={timeframe === "30days" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe("30days")}
              className={timeframe === "30days" ? "bg-primary-50 text-primary-700" : ""}
            >
              30 days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Placeholder */}
        <div className="h-64 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-primary-400 mb-4" />
            <p className="text-gray-600 font-medium">Workout Intensity Chart</p>
            <p className="text-sm text-gray-500 mt-1">
              {timeframe === "7days" ? "Last 7 days" : "Last 30 days"} workout data
            </p>
            {data?.weeklyProgress !== undefined && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Weekly Progress: {data.weeklyProgress || 0}/{data.weeklyGoal || 4} workouts</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
