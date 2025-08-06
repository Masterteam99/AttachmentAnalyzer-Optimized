import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChartLine, 
  Dumbbell, 
  Video, 
  Trophy, 
  Watch, 
  Star, 
  LogOut,
  Activity,
  Brain,
  Award,
  User
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NavigationSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: ChartLine },
    { name: "Setup Profilo", href: "/onboarding", icon: User },
    { name: "Daily Workout", href: "/daily-workout", icon: Activity },
    { name: "Workout Plans", href: "/workout-plans", icon: Dumbbell },
    { name: "Adaptive Plans", href: "/adaptive-plans", icon: Brain },
    { name: "Professional Exercises", href: "/professional-exercises", icon: Award },
    { name: "Movement Analysis", href: "/movement-analysis", icon: Video },
    { name: "Achievements", href: "/achievements", icon: Trophy },
    { name: "Wearables", href: "/wearables", icon: Watch },
    { name: "Subscription", href: "/subscription", icon: Star },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200 custom-scrollbar">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-fitness-primary rounded-lg flex items-center justify-center">
              <Activity className="text-white text-sm" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">FitTracker Pro</span>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href)
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <Icon 
                      className={`mr-3 text-sm ${
                        isActive(item.href) ? "text-primary-500" : "text-gray-400"
                      }`} 
                      size={16}
                    />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
          
          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.subscriptionStatus === 'active' ? 'Premium Member' : 'Free Member'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="mt-3 w-full justify-start text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
