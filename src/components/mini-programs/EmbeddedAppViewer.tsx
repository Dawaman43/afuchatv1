import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  MoreVertical,
  Share2,
  Flag,
  X,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface EmbeddedAppViewerProps {
  appName: string;
  appUrl: string;
  appIcon?: string;
  onClose: () => void;
}

export const EmbeddedAppViewer = ({ 
  appName, 
  appUrl, 
  appIcon, 
  onClose 
}: EmbeddedAppViewerProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: appName,
          text: `Check out ${appName} on AfuChat!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReport = () => {
    toast.info('Report submitted. Our team will review this app.');
  };

  const handleOpenExternal = () => {
    window.open(appUrl, '_blank', 'noopener,noreferrer');
  };

  // Check if URL is relative (internal route) or absolute (external URL)
  const isRelativeUrl = appUrl.startsWith('/');
  const fullUrl = isRelativeUrl ? `${window.location.origin}${appUrl}` : appUrl;
  
  // Get hostname safely
  const getHostname = () => {
    try {
      if (isRelativeUrl) {
        return window.location.hostname;
      }
      return new URL(appUrl).hostname;
    } catch {
      return 'App';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/95 backdrop-blur-lg safe-area-top">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {appIcon && (
            <img 
              src={appIcon} 
              alt={appName} 
              className="h-8 w-8 rounded-lg shrink-0"
            />
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm truncate">{appName}</h1>
            <p className="text-xs text-muted-foreground truncate">{getHostname()}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenExternal}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Browser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                Report App
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 top-14 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading {appName}...</p>
          </div>
        </div>
      )}

      {/* Embedded iframe */}
      <iframe
        key={key}
        src={fullUrl}
        className="flex-1 w-full border-0"
        title={appName}
        onLoad={() => setIsLoading(false)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        allow="camera; microphone; geolocation; payment"
      />
    </div>
  );
};
