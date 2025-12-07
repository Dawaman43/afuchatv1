import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Home, MessageSquare, Search, Bell, User, Settings, Shield, BarChart3, Grid3x3, Gamepad2, Bot, ShoppingBag, Wallet, Send, Gift, Image as ImageIcon, Hash, TrendingUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import NotificationIcon from '@/components/nav/NotificationIcon';
import InstallPromptBanner from '@/components/InstallPromptBanner';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { AccountModeSwitcher } from '@/components/AccountModeSwitcher';
import { MobileMenuSheet } from '@/components/MobileMenuSheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DesktopHybridLayout } from '@/components/DesktopHybridLayout';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const { mode, canUseBusiness } = useAccountMode();
  const { openSettings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [chatScrollHide, setChatScrollHide] = useState(false);

  // Define functions before useEffect hooks
  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_business_mode, is_affiliate')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setIsAdmin(data.is_admin || false);
      setIsBusinessMode(data.is_business_mode || false);
      setIsAffiliate(data.is_affiliate || false);
    }
  };

  const checkBusinessMode = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_business_mode')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setIsBusinessMode(data.is_business_mode || false);
    }
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    // Only run scroll handlers on mobile
    if (!isMobile) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    const handleChatScroll = (e: CustomEvent) => {
      setChatScrollHide(e.detail.hide);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('chat-scroll-state' as any, handleChatScroll as any);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('chat-scroll-state' as any, handleChatScroll as any);
    };
  }, [lastScrollY, isMobile]);

  // Use desktop hybrid layout for tablets and desktops (after all hooks)
  if (!isMobile) {
    return <DesktopHybridLayout>{children}</DesktopHybridLayout>;
  }

  const navItems = [
    { path: '/', icon: Home, label: t('common.home') },
    { path: '/search', icon: Search, label: t('search.title') },
    { path: '/notifications', icon: Bell, label: t('common.notifications'), badge: true },
    { path: '/chats', icon: MessageSquare, label: t('common.messages') },
  ];

  // Additional features section
  const featureItems = [
    { path: '/ai-chat', icon: Bot, label: 'AI Chat', requiresAuth: true },
    { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/wallet', icon: Wallet, label: 'Wallet', requiresAuth: true },
    { path: '/transfer', icon: Send, label: 'Transfer', requiresAuth: true },
    { path: '/gifts', icon: Gift, label: 'Gifts' },
    { path: '/moments', icon: ImageIcon, label: 'Moments' },
    { path: '/trending', icon: Hash, label: 'Trending' },
    { path: '/mini-programs', icon: Grid3x3, label: 'Mini Programs' },
  ];

  if (user) {
    navItems.push({ path: `/${user.id}`, icon: User, label: t('common.profile'), badge: false });
  }

  if (isAffiliate) {
    navItems.push({ path: '/affiliate-dashboard', icon: TrendingUp, label: 'Affiliate', badge: false });
  }

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: t('admin.title'), badge: false });
  }

  if (isBusinessMode && mode === 'business') {
    navItems.push({ path: '/business/dashboard', icon: BarChart3, label: t('business.title'), badge: false });
  }

  navItems.push({ path: '/settings', icon: Settings, label: t('common.settings'), badge: false });

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Hide bottom navigation in chat rooms
  const isChatRoom = location.pathname.startsWith('/chat/');

  return (
    <div className="min-h-screen bg-background select-none">
      <InstallPromptBanner />
      <OfflineIndicator />

      {/* Main Content */}
      <main className="min-h-screen pb-20">
        <motion.div 
          className="min-h-screen"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation - X-style clean design */}
      {!isChatRoom && (
        <div className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
          (isScrollingDown || chatScrollHide) ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}>
          <nav className="bg-background/95 backdrop-blur-md border-t border-border/40">
            <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
              <Link
                to="/home"
                onClick={(e) => {
                  if (location.pathname === '/home' || location.pathname === '/') {
                    e.preventDefault();
                    sessionStorage.removeItem('feedShuffleSeed');
                    window.dispatchEvent(new Event('refresh-feed-order'));
                  }
                }}
                className={cn(
                  "flex items-center justify-center w-14 h-14 transition-colors",
                  isActive('/') ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Home className={cn(
                  "h-[26px] w-[26px]",
                  isActive('/') && "fill-current"
                )} strokeWidth={isActive('/') ? 2.5 : 1.75} />
              </Link>
              
              <Link
                to="/search"
                className={cn(
                  "flex items-center justify-center w-14 h-14 transition-colors",
                  isActive('/search') ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Search className="h-[26px] w-[26px]" strokeWidth={isActive('/search') ? 2.5 : 1.75} />
              </Link>
              
              <MobileMenuSheet />
              
              <Link
                to="/notifications"
                className={cn(
                  "flex items-center justify-center w-14 h-14 transition-colors relative",
                  isActive('/notifications') ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Bell className={cn(
                  "h-[26px] w-[26px]",
                  isActive('/notifications') && "fill-current"
                )} strokeWidth={isActive('/notifications') ? 2.5 : 1.75} />
              </Link>
              
              <Link
                to="/chats"
                className={cn(
                  "flex items-center justify-center w-14 h-14 transition-colors",
                  isActive('/chats') ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <MessageSquare className={cn(
                  "h-[26px] w-[26px]",
                  isActive('/chats') && "fill-current"
                )} strokeWidth={isActive('/chats') ? 2.5 : 1.75} />
              </Link>
            </div>
          </nav>
          {/* Safe area padding for devices with home indicator */}
          <div className="bg-background/95 backdrop-blur-md h-[env(safe-area-inset-bottom)]" />
        </div>
      )}
    </div>
  );
};

export default Layout;
