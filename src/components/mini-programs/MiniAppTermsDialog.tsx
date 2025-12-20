import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, ExternalLink, MessageSquare, Mail, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MiniAppTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  appId: string;
  developerEmail?: string;
  privacyUrl?: string;
  termsUrl?: string;
  onAccept: () => void;
}

const ACCEPTED_APPS_KEY = 'afuchat_accepted_mini_apps';

export const getAcceptedApps = (): Set<string> => {
  try {
    const stored = localStorage.getItem(ACCEPTED_APPS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Error reading accepted apps:', e);
  }
  return new Set();
};

export const markAppAsAccepted = (appId: string) => {
  try {
    const accepted = getAcceptedApps();
    accepted.add(appId);
    localStorage.setItem(ACCEPTED_APPS_KEY, JSON.stringify([...accepted]));
  } catch (e) {
    console.error('Error saving accepted app:', e);
  }
};

export const hasAcceptedApp = (appId: string): boolean => {
  return getAcceptedApps().has(appId);
};

export const MiniAppTermsDialog = ({
  open,
  onOpenChange,
  appName,
  appId,
  developerEmail,
  privacyUrl,
  termsUrl,
  onAccept,
}: MiniAppTermsDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      markAppAsAccepted(appId);
      onAccept();
      onOpenChange(false);
    }
  };

  const handleContactDeveloper = () => {
    // Navigate to chats with developer email as context
    if (developerEmail) {
      // For now, show a toast or navigate to a support chat
      navigate('/chats');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Before you continue</DialogTitle>
          </div>
          <DialogDescription>
            Review the terms for <strong>{appName}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 space-y-4">
            {/* Developer Contact */}
            {developerEmail && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Developer Contact
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  For support or questions about this app:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleContactDeveloper}
                >
                  <MessageSquare className="h-4 w-4" />
                  Contact Developer
                </Button>
              </div>
            )}

            {/* Terms & Privacy Links */}
            <div className="space-y-2">
              {termsUrl && (
                <a
                  href={termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Terms of Service</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              )}

              {privacyUrl && (
                <a
                  href={privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Privacy Policy</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              )}

              {/* AfuChat Mini Apps Terms */}
              <a
                href="/terms-of-use#mini-programs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AfuChat Mini Apps Terms</span>
                </div>
                <ExternalLink className="h-4 w-4 text-primary" />
              </a>
            </div>

            {/* Safety Notice */}
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-yellow-600">Safety Notice:</strong> This app is provided by a third-party developer. 
                AfuChat does not control the content or data practices of this app. Use at your own discretion.
              </p>
            </div>

            {/* Accept Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <label htmlFor="accept-terms" className="text-sm cursor-pointer leading-tight">
                I have reviewed and agree to the app's terms and privacy policy, and the{' '}
                <a href="/terms-of-use#mini-programs" className="text-primary hover:underline" target="_blank">
                  AfuChat Mini Apps Terms
                </a>
              </label>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 pt-2 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!accepted} onClick={handleAccept}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
