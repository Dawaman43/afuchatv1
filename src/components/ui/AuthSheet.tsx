import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore: Assuming supabase client is correctly typed elsewhere, ignore for component typing
import { supabase } from '@/integrations/supabase/client'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

// --- Type Definitions ---

interface AuthSheetContentProps {
  onClose: () => void;
}

interface AuthSheetProps {
  isOpen: boolean;
  // Standard type for shadcn/ui Dialog/Sheet components open change handler
  onOpenChange: (open: boolean) => void;
}

// --- Auth Sheet Content Component ---

const AuthSheetContent: React.FC<AuthSheetContentProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');

  // Use TypeScript's specific type for form submission event
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
        onClose(); // Close the sheet after successful sign up
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success('Signed in successfully!');
        // No explicit navigate is needed; parent component/AuthContext handles re-render
        onClose(); 
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Card is used for styling the content inside the dialog
    <Card className="w-full border-none shadow-none">
        <CardHeader className="space-y-1 pt-6 pb-2">
            <div className="flex justify-center">
                <Logo size="md" />
            </div>
            <CardTitle className="text-xl font-bold text-center pt-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-center">
                {isSignUp
                    ? 'Sign up for AfuChat - text-only messaging in Uganda'
                    : 'Sign in to your AfuChat account'}
            </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
            <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="Your Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="handle">Handle</Label>
                            <Input
                                id="handle"
                                type="text"
                                placeholder="@yourhandle"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                required
                            />
                        </div>
                    </>
                )}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline"
                >
                    {isSignUp
                        ? 'Already have an account? Sign in'
                        : "Don't have an account? Sign up"}
                </button>
            </div>
        </CardContent>
    </Card>
  );
};

// --- Exported AuthSheet Component (The Sheet Wrapper) ---

const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Custom DialogContent for a mobile sheet effect */}
      <DialogContent 
        // Key styling for the sheet effect: fixed, bottom-aligned, rounded on top
        className="fixed bottom-0 left-0 right-0 w-full max-w-lg mx-auto p-0 rounded-t-xl rounded-b-none shadow-2xl
                   translate-y-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        // Prevent closing when clicking outside to ensure user completes auth flow
        onPointerDownOutside={(e) => e.preventDefault()} 
        style={{ pointerEvents: 'auto' }} 
      >
        <AuthSheetContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default AuthSheet;
