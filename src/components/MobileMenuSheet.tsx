import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountMode } from '@/contexts/AccountModeContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Grid3x3,
  ShoppingBag,
  Building2,
  Gamepad2,
  Star,
  Wallet,
  Send,
  Gift,
  Shield,
  BarChart3,
  Image as ImageIcon,
  Settings,
  Users,
  TrendingUp,
  Hash,
  Zap,
  Globe,
  Bell
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  description?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresBusiness?: boolean;
  requiresAffiliate?: boolean;
}

export function MobileMenuSheet() {
  const { user } = useAuth();
  const { mode } = useAccountMode();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, is_business_mode, is_affiliate')
      .eq('id', user.id)
      .single();

    if (data) {
      setIsAdmin(data.is_admin || false);
      setIsBusinessMode(data.is_business_mode || false);
      setIsAffiliate(data.is_affiliate || false);
    }
  };

  const menuSections = [
    {
      title: 'Shopping & Finance',
      items: [
        { icon: ShoppingBag, label: 'Shop', path: '/shop', description: 'Browse items' },
        { icon: Wallet, label: 'Wallet', path: '/wallet', description: 'Manage XP', requiresAuth: true },
        { icon: Send, label: 'Transfer', path: '/transfer', description: 'Send XP', requiresAuth: true },
        { icon: Gift, label: 'Gifts', path: '/wallet', description: 'Send gifts', requiresAuth: true },
      ] as MenuItem[]
    },
    {
      title: 'Games & Entertainment',
      items: [
        { icon: Gamepad2, label: 'Games', path: '/games', description: 'Play games' },
        { icon: Star, label: 'Leaderboard', path: '/leaderboard', description: 'Top players' },
      ] as MenuItem[]
    },
    {
      title: 'Content & Social',
      items: [
        { icon: ImageIcon, label: 'Moments', path: '/moments', description: 'Stories & moments' },
        { icon: Hash, label: 'Trending', path: '/trending', description: 'Trending hashtags' },
        { icon: Users, label: 'Discover', path: '/suggested-users', description: 'Find users' },
      ] as MenuItem[]
    },
    {
      title: 'Super App',
      items: [
        { icon: Grid3x3, label: 'Mini Programs', path: '/mini-programs', description: 'Apps & tools' },
        { icon: Zap, label: 'Super App Hub', path: '/super-app', description: 'All services' },
        { icon: Globe, label: 'Travel', path: '/travel', description: 'Book trips' },
      ] as MenuItem[]
    }
  ];

  // Add business section if user has business mode
  if (isBusinessMode && mode === 'business') {
    menuSections.push({
      title: 'Business',
      items: [
        { icon: BarChart3, label: 'Dashboard', path: '/business/dashboard', description: 'Business analytics', requiresBusiness: true },
      ] as MenuItem[]
    });
  }

  // Add affiliate section if user is affiliate
  if (isAffiliate) {
    menuSections.push({
      title: 'Affiliate',
      items: [
        { icon: TrendingUp, label: 'Affiliate Dashboard', path: '/affiliate/dashboard', description: 'Track earnings', requiresAffiliate: true },
      ] as MenuItem[]
    });
  }

  // Add admin section if user is admin
  if (isAdmin) {
    menuSections.push({
      title: 'Admin',
      items: [
        { icon: Shield, label: 'Admin Panel', path: '/admin', description: 'Manage platform', requiresAdmin: true },
      ] as MenuItem[]
    });
  }

  // Always add settings and notifications
  menuSections.push({
    title: 'Account',
    items: [
      { icon: Bell, label: 'Notifications', path: '/notifications', description: 'Your alerts', requiresAuth: true },
      { icon: Settings, label: 'Settings', path: '/settings', description: 'Preferences' },
    ] as MenuItem[]
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-muted-foreground hover:text-primary"
          aria-label="More options"
        >
          <Grid3x3 className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-2xl font-bold">All Features</SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(85vh-80px)] pb-6">
          {menuSections.map((section, idx) => (
            <div key={section.title} className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  // Check if item should be shown based on requirements
                  if (item.requiresAuth && !user) return null;
                  if (item.requiresAdmin && !isAdmin) return null;
                  if (item.requiresBusiness && (!isBusinessMode || mode !== 'business')) return null;
                  if (item.requiresAffiliate && !isAffiliate) return null;

                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-4 hover:bg-muted"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <item.icon className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-medium text-base">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
              {idx < menuSections.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
