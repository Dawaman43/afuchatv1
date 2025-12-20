import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, Download, ExternalLink, Play, User, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface AppPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    category: string;
    url: string;
    rating: number;
    install_count: number;
    screenshots?: string[];
    features?: string;
    created_at?: string;
    profiles?: {
      display_name: string;
    };
  } | null;
  onOpen: () => void;
}

export const AppPreviewDialog = ({ open, onOpenChange, app, onOpen }: AppPreviewDialogProps) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState(0);

  if (!app) return null;

  const screenshots = app.screenshots || [];
  const featuresList = app.features?.split('\n').filter(f => f.trim()) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-4">
            <DialogHeader className="pb-4">
              <div className="flex items-start gap-4">
                {/* App Icon */}
                <div className="h-20 w-20 rounded-2xl shadow-lg overflow-hidden flex-shrink-0 bg-muted">
                  {app.icon_url ? (
                    <img 
                      src={app.icon_url} 
                      alt={app.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-primary flex items-center justify-center">
                      <span className="text-3xl">📱</span>
                    </div>
                  )}
                </div>
                
                {/* App Info */}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl font-bold mb-1">{app.name}</DialogTitle>
                  <Badge variant="outline" className="text-xs capitalize mb-2">
                    {app.category}
                  </Badge>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{app.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">{app.install_count || 0}+</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Screenshots */}
            {screenshots.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Screenshots</h3>
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {screenshots.map((screenshot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedScreenshot(index)}
                        className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedScreenshot === index ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <img 
                          src={screenshot} 
                          alt={`Screenshot ${index + 1}`}
                          className="h-32 w-auto object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
                
                {/* Selected Screenshot Preview */}
                {screenshots[selectedScreenshot] && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-border">
                    <img 
                      src={screenshots[selectedScreenshot]} 
                      alt="Preview"
                      className="w-full h-auto object-contain max-h-64"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {app.description || 'No description available.'}
              </p>
            </div>

            {/* Features */}
            {featuresList.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Features</h3>
                <ul className="space-y-1.5">
                  {featuresList.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {feature.replace(/^[•\-]\s*/, '')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Developer Info */}
            <div className="mb-4 p-3 bg-muted/50 rounded-xl">
              <h3 className="text-sm font-semibold mb-2">Developer</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{app.profiles?.display_name || 'Community Developer'}</span>
              </div>
              {app.created_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Published {format(new Date(app.created_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Safety Notice */}
            <div className="mb-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Safety Notice</p>
                  <p>This app runs inside AfuChat. Your data is protected by our security policies.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(app.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                External
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  onOpen();
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Open App
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
