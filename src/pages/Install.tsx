import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Check, Smartphone, Zap, Wifi, Share } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import usePWA from '@/hooks/usePWA';

const Install = () => {
  const navigate = useNavigate();
  const { isInstalled, canInstall, isIOS, install } = usePWA();

  const handleInstallClick = async () => {
    const result = await install();
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.info(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Install AfuChat</CardTitle>
          <CardDescription>
            Get the full app experience with offline support and faster loading
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Native App Experience</h3>
                <p className="text-sm text-muted-foreground">Works just like a native app - no browser required</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Works Offline</h3>
                <p className="text-sm text-muted-foreground">Access your content even without internet</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Instant loading with smart caching</p>
              </div>
            </div>
          </div>

          {/* Install Button */}
          {isInstalled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary p-4 bg-primary/10 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="font-semibold">App is installed!</span>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
                variant="default"
              >
                Go to App
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm font-medium text-foreground">To install on iOS:</p>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">1</span>
                    <span>Tap the <Share className="inline h-4 w-4" /> Share button</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">2</span>
                    <span>Scroll and tap "Add to Home Screen"</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">3</span>
                    <span>Tap "Add" to confirm</span>
                  </li>
                </ol>
              </div>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Continue in Browser
              </Button>
            </div>
          ) : canInstall ? (
            <div className="space-y-3">
              <Button 
                onClick={handleInstallClick}
                className="w-full"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Install Now
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Use your browser's menu to install this app, or continue using it in your browser.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Continue to App
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
