import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import platformLogo from '@/assets/platform-logo.png';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <CustomLoader size="lg" />
      </div>
    );
  }

  // Logged in users go directly to home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <img src={platformLogo} alt="AfuChat" className="h-8 w-8 rounded-lg" />
          <span className="text-xl font-bold text-foreground">AfuChat</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/auth/signin')}
          className="text-muted-foreground hover:text-foreground"
        >
          Sign In
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <motion.img 
            src={platformLogo} 
            alt="AfuChat" 
            className="h-24 w-24 mx-auto mb-6 rounded-2xl shadow-lg"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Welcome to AfuChat
          </h1>
          
          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            Connect, share, and earn rewards. Join millions of users on the next-generation social platform.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/auth/signup')}
              className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/auth/signin')}
              className="w-full h-12 text-base font-semibold rounded-xl border-border"
            >
              I already have an account
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">
            Terms
          </button>
          <span>•</span>
          <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
            Privacy
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Index;
