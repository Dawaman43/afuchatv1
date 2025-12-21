import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Lock, Shield, Eye, EyeOff, UserX, Clock, Users, Crown, MessageCircle, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

export const SecuritySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [hideFollowingList, setHideFollowingList] = useState(false);
  const [hideFollowersList, setHideFollowersList] = useState(false);
  const [telegramLinkCode, setTelegramLinkCode] = useState<string | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
      checkTelegramLink();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('is_private, show_online_status, show_read_receipts, hide_following_list, hide_followers_list')
      .eq('id', user.id)
      .single();

    if (data) {
      setPrivateAccount(data.is_private || false);
      setShowOnlineStatus(data.show_online_status ?? true);
      setShowReadReceipts(data.show_read_receipts ?? true);
      setHideFollowingList(data.hide_following_list || false);
      setHideFollowersList(data.hide_followers_list || false);
    }
  };

  const checkTelegramLink = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('telegram_users')
      .select('is_linked, telegram_username, link_token, link_token_expires_at')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setTelegramLinked(data.is_linked || false);
      // Check if there's a valid unexpired code
      if (data.link_token && data.link_token_expires_at) {
        const expiresAt = new Date(data.link_token_expires_at);
        if (expiresAt > new Date()) {
          setTelegramLinkCode(data.link_token);
        }
      }
    }
  };

  const generateTelegramLinkCode = async () => {
    if (!user) return;
    
    setGeneratingCode(true);
    try {
      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry
      
      // Check if user already has a telegram_users record
      const { data: existing } = await supabase
        .from('telegram_users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (existing) {
        // Update existing record
        await supabase
          .from('telegram_users')
          .update({
            link_token: code,
            link_token_expires_at: expiresAt.toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new record - we need a placeholder telegram_id since the real linking happens from Telegram
        // Use a negative number as placeholder (will be updated when user enters code in Telegram)
        const placeholderId = -Math.floor(Math.random() * 1000000000);
        await supabase
          .from('telegram_users')
          .insert({
            telegram_id: placeholderId,
            user_id: user.id,
            link_token: code,
            link_token_expires_at: expiresAt.toISOString(),
            is_linked: false
          });
      }
      
      setTelegramLinkCode(code);
      toast.success('Link code generated! Valid for 10 minutes.');
    } catch (error) {
      console.error('Error generating link code:', error);
      toast.error('Failed to generate code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (telegramLinkCode) {
      navigator.clipboard.writeText(telegramLinkCode);
      toast.success('Code copied to clipboard!');
    }
  };

  const unlinkTelegram = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('telegram_users')
        .update({ 
          is_linked: false, 
          telegram_id: null,
          telegram_username: null 
        })
        .eq('user_id', user.id);
      
      setTelegramLinked(false);
      setTelegramLinkCode(null);
      toast.success('Telegram unlinked successfully');
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast.error('Failed to unlink Telegram');
    }
  };

  const handlePrivacyToggle = async (field: string, value: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);
      
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Account Security</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate('/change-password')}>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Change</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate('/security')}>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">View</Button>
          </div>
        </div>
      </Card>

      {/* Telegram Linking Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Telegram Integration</h3>
        </div>
        <div className="space-y-4">
          {telegramLinked ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Telegram Linked
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Telegram account is connected to AfuChat
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={unlinkTelegram}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  Unlink
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="mb-4">
                <p className="font-medium mb-2">Link Your Telegram</p>
                <p className="text-sm text-muted-foreground">
                  Connect your Telegram to access AfuChat features from the Telegram bot. 
                  Generate a secure code below and enter it in our Telegram bot.
                </p>
              </div>
              
              {telegramLinkCode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <code className="text-2xl font-mono font-bold tracking-widest flex-1 text-center">
                      {telegramLinkCode}
                    </code>
                    <Button size="icon" variant="ghost" onClick={copyCodeToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Code expires in 10 minutes
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={generateTelegramLinkCode}
                      disabled={generatingCode}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generatingCode ? 'animate-spin' : ''}`} />
                      New Code
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => window.open('https://t.me/AfuChatBot', '_blank')}
                    >
                      Open Telegram Bot
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={generateTelegramLinkCode}
                    disabled={generatingCode}
                    className="flex-1"
                  >
                    {generatingCode ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Link Code'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Privacy Controls</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Private Account</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Hide your profile content from other users. Your avatar, bio, stats, posts, gifts, and all personal data will be hidden. Only your username will be visible.
              </p>
            </div>
            <Switch
              checked={privateAccount}
              onCheckedChange={(checked) => {
                setPrivateAccount(checked);
                handlePrivacyToggle('is_private', checked);
              }}
            />
          </div>
          
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Show Online Status</p>
              </div>
              <p className="text-sm text-muted-foreground">Let others see when you're online</p>
            </div>
            <Switch
              checked={showOnlineStatus}
              onCheckedChange={(checked) => {
                setShowOnlineStatus(checked);
                handlePrivacyToggle('show_online_status', checked);
              }}
            />
          </div>
          
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Read Receipts</p>
              </div>
              <p className="text-sm text-muted-foreground">Show when you've read messages</p>
            </div>
            <Switch
              checked={showReadReceipts}
              onCheckedChange={(checked) => {
                setShowReadReceipts(checked);
                handlePrivacyToggle('show_read_receipts', checked);
              }}
            />
          </div>
          
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Hide Following List</p>
                {!isPremium && (
                  <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Hide who you follow from other users</p>
            </div>
            <Switch
              checked={hideFollowingList}
              disabled={!isPremium}
              onCheckedChange={(checked) => {
                if (!isPremium) {
                  toast.error('Premium feature', {
                    description: 'Upgrade to Premium to hide your following list',
                    action: {
                      label: 'Upgrade',
                      onClick: () => navigate('/premium'),
                    },
                  });
                  return;
                }
                setHideFollowingList(checked);
                handlePrivacyToggle('hide_following_list', checked);
              }}
            />
          </div>
          
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Hide Followers List</p>
              </div>
              <p className="text-sm text-muted-foreground">Hide your followers from other users</p>
            </div>
            <Switch
              checked={hideFollowersList}
              onCheckedChange={(checked) => {
                setHideFollowersList(checked);
                handlePrivacyToggle('hide_followers_list', checked);
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
