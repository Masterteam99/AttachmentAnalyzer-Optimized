import { useToast as useOriginalToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, X, RefreshCw, Wifi } from "lucide-react";

export interface EnhancedToastOptions {
  title?: string;
  description: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  retry?: {
    onRetry: () => void;
    isLoading?: boolean;
  };
  persistent?: boolean;
  errorId?: string;
}

export function useEnhancedToast() {
  const { toast: originalToast } = useOriginalToast();

  const toast = (options: EnhancedToastOptions) => {
    const {
      title,
      description,
      variant = "default",
      duration,
      action,
      retry,
      persistent = false,
      errorId
    } = options;

    // Get icon based on variant
    const getIcon = () => {
      switch (variant) {
        case "destructive":
          return <AlertTriangle className="h-4 w-4" />;
        case "success":
          return <CheckCircle className="h-4 w-4" />;
        case "warning":
          return <AlertTriangle className="h-4 w-4" />;
        case "info":
          return <Info className="h-4 w-4" />;
        default:
          return null;
      }
    };

    // Build action element
    const buildAction = () => {
      const buttons = [];

      if (retry) {
        buttons.push(
          <Button
            key="retry"
            variant="outline"
            size="sm"
            onClick={retry.onRetry}
            disabled={retry.isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${retry.isLoading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        );
      }

      if (action) {
        buttons.push(
          <Button
            key="action"
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="h-8"
          >
            {action.label}
          </Button>
        );
      }

      return buttons.length > 0 ? (
        <div className="flex gap-2">
          {buttons}
        </div>
      ) : undefined;
    };

    // Build description with error ID if provided
    const buildDescription = () => {
      if (errorId) {
        return (
          <div>
            <p>{description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Error ID: <code className="bg-muted px-1 rounded">{errorId}</code>
            </p>
          </div>
        );
      }
      return description;
    };

    return originalToast({
      title: title,
      description: buildDescription(),
      variant: variant === "success" || variant === "warning" || variant === "info" ? "default" : variant,
      duration: persistent ? Infinity : duration,
      action: buildAction(),
    });
  };

  // Convenience methods
  const success = (message: string, options?: Partial<EnhancedToastOptions>) => {
    return toast({
      description: message,
      variant: "success",
      ...options,
    });
  };

  const error = (message: string, options?: Partial<EnhancedToastOptions>) => {
    return toast({
      description: message,
      variant: "destructive",
      duration: 8000,
      ...options,
    });
  };

  const warning = (message: string, options?: Partial<EnhancedToastOptions>) => {
    return toast({
      description: message,
      variant: "warning",
      ...options,
    });
  };

  const info = (message: string, options?: Partial<EnhancedToastOptions>) => {
    return toast({
      description: message,
      variant: "info",
      ...options,
    });
  };

  const networkError = (onRetry?: () => void) => {
    return error("Network connection failed. Please check your internet connection.", {
      title: "Connection Error",
      retry: onRetry ? { onRetry } : undefined,
      persistent: true,
    });
  };

  const authError = (onLogin?: () => void) => {
    return error("Your session has expired. Please log in again.", {
      title: "Authentication Required",
      action: onLogin ? { label: "Log In", onClick: onLogin } : undefined,
      persistent: true,
    });
  };

  const serverError = (errorId?: string, onRetry?: () => void) => {
    return error("Server error occurred. Our team has been notified.", {
      title: "Server Error",
      errorId,
      retry: onRetry ? { onRetry } : undefined,
    });
  };

  const rateLimitError = () => {
    return warning("Too many requests. Please wait a moment before trying again.", {
      title: "Rate Limited",
      duration: 10000,
    });
  };

  const offlineNotice = () => {
    return info("You're currently offline. Some features may not work properly.", {
      title: "Offline Mode",
      persistent: true,
    });
  };

  const backOnline = () => {
    return success("Back online! Your data is being synced.", {
      title: "Connected",
      duration: 3000,
    });
  };

  return {
    toast,
    success,
    error,
    warning,
    info,
    networkError,
    authError,
    serverError,
    rateLimitError,
    offlineNotice,
    backOnline,
  };
}
