import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflinePageProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const OfflinePage = ({ 
  title = "You're Offline",
  description = "Please check your internet connection and try again.",
  onRetry
}: OfflinePageProps) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mb-4 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mb-6 text-muted-foreground">
          {description}
        </p>
        <Button onClick={handleRetry} variant="default">
          Try Again
        </Button>
      </div>
    </div>
  );
};
