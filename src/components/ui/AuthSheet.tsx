import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore: Assuming supabase client is correctly typed elsewhere, ignore for component typing
import { supabase } from '@/integrations/supabase/client'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { X, Eye, EyeOff, User, AtSign, Mail, Lock } from 'lucide-react';
import Logo from '@/components/Logo';

interface AuthSheetContentProps {
  onClose: () => void;
}

interface AuthSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthSheetContent: React.FC<AuthSheetContentProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              handle: handle,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        
        toast.success('Account created! Check your email for verification.');
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success('Signed in successfully!');
        onClose(); 
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border border-border/50 shadow-xl flex flex-col h-full">
      <CardHeader className="space-y-1 pt-2 pb-1 relative flex-shrink-0">
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-4 w-4 p-0 rounded-full hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        <div className="flex justify-center">
          <Logo size="xs" className="text-xl" />
        </div>
        <div className="space-y-0">
          <CardTitle className="text-base font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-xs text-center text-muted-foreground leading-none">
            {isSignUp
              ? 'AfuChat - Uganda messaging'
              : 'Sign in'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0 flex-1 overflow-y-auto flex flex-col">
        <form onSubmit={handleAuth} className="space-y-2 flex-1">
          {isSignUp && (
            <>
              <div className="space-y-0.5">
                <Label htmlFor="displayName" className="text-xs font-medium flex items-center gap-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  Display Name
                </Label>
                <div className="relative">
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="h-8 pl-6 pr-2 bg-background/80 backdrop-blur-sm border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-100 hover:border-border/60 text-xs"
                  />
                  <User className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="handle" className="text-xs font-medium flex items-center gap-0.5">
                  <AtSign className="h-3 w-3 text-muted-foreground" />
                  Handle
                </Label>
                <div className="relative">
                  <Input
                    id="handle"
                    type="text"
                    placeholder="@handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    className="h-8 pl-6 pr-2 bg-background/80 backdrop-blur-sm border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-100 hover:border-border/60 text-xs"
                  />
                  <AtSign className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </>
          )}
          <div className="space-y-0.5">
            <Label htmlFor="email" className="text-xs font-medium flex items-center gap-0.5">
              <Mail className="h-3 w-3 text-muted-foreground" />
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 pl-6 pr-2 bg-background/80 backdrop-blur-sm border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-100 hover:border-border/60 text-xs"
              />
              <Mail className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="password" className="text-xs font-medium flex items-center gap-0.5">
              <Lock className="h-3 w-3 text-muted-foreground" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-8 pl-6 pr-6 bg-background/80 backdrop-blur-sm border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-100 hover:border-border/60 text-xs"
              />
              <Lock className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0.5 top-1 h-5 w-5 p-0 hover:bg-accent rounded transition-colors duration-100"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full h-8 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-100 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90" disabled={loading}>
            {loading ? (
              <>
                <span className="mr-1 animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                Processing...
              </>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
        <div className="mt-2 pt-2 border-t border-border/20 text-center flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-0.5">Or continue with</p>
          <div className="flex justify-center space-x-1">
          </div>
        </div>
        <div className="mt-2 text-center flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors duration-100"
          >
            {isSignUp
              ? 'Have account? '
              : "No account? "}
            <span className="font-medium underline hover:no-underline">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-full max-w-[300px] sm:max-w-xs lg:max-w-sm mx-auto p-2 sm:p-2.5 md:p-3 max-h-[95vh] overflow-hidden rounded-xl shadow-2xl backdrop-blur-md bg-card/95 border-border/20 border"
      >
        <div className="h-full flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <AuthSheetContent onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthSheet;
