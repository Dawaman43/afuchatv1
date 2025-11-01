import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Radio, Send, MessageSquarePlus, Search as SearchIcon, User, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Chats from './Chats';
import Feed from './Feed';
import Search from './Search';
import NewPostModal from '@/components/ui/NewPostModal';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import NewChatDialog from '@/components/ui/NewChatDialog';
import NotificationIcon from '@/components/nav/NotificationIcon';


// --- FAB Components (Positioned at bottom-20, above the collapsible nav) ---
// Note: FAB visibility is now controlled by the parent component's translate class
const NewPostFAB = ({ onClick, visible, isNavVisible }) => (
  <Button 
    size="lg" 
    onClick={onClick}
    aria-label="Create new post"
    className={`fixed bottom-20 right-6 rounded-full shadow-2xl h-14 w-14 transition-all duration-300 ease-in-out z-50 ${
      (visible && isNavVisible) ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
    }`}
  >
    <Send className="h-6 w-6" />
  </Button>
);

const NewChatFAB = ({ onClick, visible, isNavVisible }) => (
  <Button 
    size="lg" 
    onClick={onClick}
    aria-label="Start new chat"
    className={`fixed bottom-20 right-6 rounded-full shadow-2xl h-14 w-14 transition-all duration-300 ease-in-out z-50 ${
      (visible && isNavVisible) ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
    }`}
  >
    <MessageSquarePlus className="h-6 w-6" />
  </Button>
);
// --- END FAB Components ---

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed'); 
  const [isPostModalOpen, setIsPostModalOpen] = useState(false); 
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [forceLoaded, setForceLoaded] = useState(false);

  // --- Scroll-Hiding Nav State ---
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);
  // -------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // --- Scroll Logic for Hiding All Elements ---
  useEffect(() => {
    const headerHeight = headerRef.current ? headerRef.current.offsetHeight : 56; // Fallback to 56px (h-14)

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hiding condition: Scrolling down AND scrolled past the initial header height
      if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Showing condition: Scrolling up
        setIsNavVisible(true);
      } else if (currentScrollY <= headerHeight) {
        // Always show at the top of the page
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  // ------------------------------------

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const effectiveLoading = loading && !forceLoaded;

  const handleViewProfile = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleNewPost = () => {
    if (user) {
      setIsPostModalOpen(true);
    } else {
      navigate('/auth'); 
    }
  };

  const handleNewChat = () => {
    if (user) {
      setIsChatModalOpen(true);
    } else {
      navigate('/auth');
    }
  };

  const headerTranslateClass = isNavVisible ? 'translate-y-0' : '-translate-y-full';
  const navTranslateClass = isNavVisible ? 'translate-y-0' : 'translate-y-full';


  if (effectiveLoading) {
    // Custom splash screen: White background with centered blue gradient "bubble" and app name
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="relative">
          {/* Custom chat bubble shape using SVG (blue gradient, no logo) */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="bubbleGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
              </radialGradient>
            </defs>
            <path
              d="M60 10C30 10 10 30 10 60c0 20 15 35 35 35h20l15 15v-15h10c30 0 50 -20 50 -50S90 10 60 10Z"
              fill="url(#bubbleGrad)"
              stroke="#1D4ED8"
              strokeWidth="2"
            />
          </svg>
          {/* Subtle eyes and smile using simple paths (emoji-inspired but custom) */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="absolute top-0 left-0 pointer-events-none"
          >
            {/* Eyes */}
            <circle cx="40" cy="45" r="6" fill="white" />
            <circle cx="80" cy="45" r="6" fill="white" />
            <circle cx="40" cy="45" r="3" fill="#1D4ED8" />
            <circle cx="80" cy="45" r="3" fill="#1D4ED8" />
            {/* Smile */}
            <path d="M35 70 Q60 85 85 70" stroke="#1D4ED8" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-800">AfuChat</h1>
        <p className="mt-2 text-sm text-gray-500">Loading your chats...</p>
      </div>
    );
  }

  return (
    // Removed pb-16 since the fixed nav no longer occupies space when hidden
    <div className="min-h-screen bg-background flex flex-col"> 
      {/* Header (Hides on Scroll Down) */}
      <header 
        ref={headerRef}
        className={`bg-background sticky top-0 z-20 transition-transform duration-300 ease-in-out ${headerTranslateClass}`}
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Keep original Logo for header if desired, or replace with custom here too */}
            <Logo size="md" />
            <h1 className="text-lg font-bold text-primary">AfuChat</h1>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Conditional Login Button or User Icons */}
            {user ? (
              // Logged In: Show icons
              <>
                <NotificationIcon />
                {isAdmin && (
                  <Link to="/admin">
                    <Button size="icon" variant="ghost" className="rounded-full">
                      <Shield className="h-5 w-5 text-primary" />
                    </Button>
                  </Link>
                )}
                <Link to={`/profile/${user.id}`}>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            ) : (
              // Logged Out: Show Log In Button
              <Link to="/auth">
                <Button size="sm" variant="default" className="text-sm font-semibold">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-1 relative">
            <TabsContent value="feed" className="h-full mt-0">
              <Feed />
            </TabsContent>
            <TabsContent value="search" className="h-full mt-0">
              <Search />
            </TabsContent>
            <TabsContent value="chats" className="h-full mt-0">
              <Chats />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Bottom Navigation (Hides on Scroll Down) */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 bg-background z-30 transition-transform duration-300 ease-in-out ${navTranslateClass}`}
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-3 h-14">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'feed' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span className="text-xs font-medium">Feed</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'search' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <SearchIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Search</span>
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'chats' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">Chats</span>
            </button>
          </div>
        </div>
      </nav>
      
      {/* FAB for new content (Visibility now depends on isNavVisible) */}
      {/* Only show FABs if the user is authenticated */}
      {user && activeTab === 'feed' && <NewPostFAB onClick={handleNewPost} visible={true} isNavVisible={isNavVisible} />}
      {user && activeTab === 'chats' && <NewChatFAB onClick={handleNewChat} visible={true} isNavVisible={isNavVisible} />}
      
      {/* Modals */}
      <NewPostModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
      />
      
      <NewChatDialog
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
    </div>
  );
};

export default Index;
