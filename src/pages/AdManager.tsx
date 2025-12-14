import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Megaphone, Plus, Eye, MousePointer, TrendingUp, Pause, Play, 
  Trash2, DollarSign, Target, BarChart3, ImageIcon, Link, FileText
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface AdCampaign {
  id: string;
  ad_type: string;
  placement: string;
  status: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  target_url: string | null;
  daily_budget: number;
  total_spent: number;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  active: 'bg-green-500/10 text-green-500',
  paused: 'bg-orange-500/10 text-orange-500',
  completed: 'bg-blue-500/10 text-blue-500',
  rejected: 'bg-destructive/10 text-destructive',
};

const AdManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [userAcoin, setUserAcoin] = useState(0);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [adType, setAdType] = useState<string>('custom_ad');
  const [placement, setPlacement] = useState<string>('all');
  const [dailyBudget, setDailyBudget] = useState<string>('10');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch user's ACoin balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('acoin')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserAcoin(profile.acoin || 0);
      }

      // Fetch user's campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch user's posts for promoted post option
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, content, image_url')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setUserPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching ad data:', error);
      toast.error('Failed to load ad data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!user) return;
    
    const budget = parseInt(dailyBudget);
    if (isNaN(budget) || budget < 10) {
      toast.error('Minimum daily budget is 10 ACoin');
      return;
    }

    if (budget > userAcoin) {
      toast.error('Insufficient ACoin balance');
      return;
    }

    if (adType === 'promoted_post' && !selectedPostId) {
      toast.error('Please select a post to promote');
      return;
    }

    if (adType === 'custom_ad' && (!title || !content)) {
      toast.error('Please fill in title and content');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_ad_campaign', {
        p_ad_type: adType,
        p_placement: placement,
        p_daily_budget: budget,
        p_title: title || null,
        p_content: content || null,
        p_image_url: imageUrl || null,
        p_target_url: targetUrl || null,
        p_post_id: adType === 'promoted_post' ? selectedPostId : null,
        p_product_id: null,
        p_end_date: null
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast.success('Ad campaign created!');
        setShowCreateDialog(false);
        resetForm();
        fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (campaign: AdCampaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id);

      if (error) throw error;
      
      toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      fetchData();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      
      toast.success('Campaign deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const resetForm = () => {
    setAdType('custom_ad');
    setPlacement('all');
    setDailyBudget('10');
    setTitle('');
    setContent('');
    setImageUrl('');
    setTargetUrl('');
    setSelectedPostId('');
  };

  const totalSpent = campaigns.reduce((sum, c) => sum + c.total_spent, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader 
        title="Ad Manager" 
        subtitle="Promote your content"
        icon={<Megaphone className="h-5 w-5 text-primary" />}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ACoin Balance Card */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ACoin Balance</p>
              <p className="text-2xl font-bold">{userAcoin.toLocaleString()}</p>
            </div>
            <Button onClick={() => navigate('/wallet')}>
              Top Up
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{activeCampaigns}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impressions</p>
                <p className="text-xl font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MousePointer className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicks</p>
                <p className="text-xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-xl font-bold">{totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Create Campaign Button */}
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="w-full mb-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Campaign
        </Button>

        {/* Campaigns List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Your Campaigns</h3>
          
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No campaigns yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first ad to start promoting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[campaign.status]}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {campaign.ad_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <h4 className="font-medium">
                          {campaign.title || `Campaign ${campaign.id.slice(0, 8)}`}
                        </h4>
                        {campaign.content && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {campaign.content}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(campaign)}
                          disabled={campaign.status === 'completed' || campaign.status === 'rejected'}
                        >
                          {campaign.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Daily</p>
                        <p className="font-medium text-sm">{campaign.daily_budget}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <p className="font-medium text-sm">{campaign.total_spent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Views</p>
                        <p className="font-medium text-sm">{campaign.impressions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="font-medium text-sm">{campaign.clicks}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Ad Campaign</DialogTitle>
            <DialogDescription>
              Spend ACoin to promote your content across the platform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ad Type</Label>
              <Select value={adType} onValueChange={setAdType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promoted_post">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Promoted Post
                    </div>
                  </SelectItem>
                  <SelectItem value="custom_ad">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Custom Ad
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {adType === 'promoted_post' && (
              <div className="space-y-2">
                <Label>Select Post to Promote</Label>
                <Select value={selectedPostId} onValueChange={setSelectedPostId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a post" />
                  </SelectTrigger>
                  <SelectContent>
                    {userPosts.map(post => (
                      <SelectItem key={post.id} value={post.id}>
                        <span className="line-clamp-1">{post.content.slice(0, 50)}...</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {adType === 'custom_ad' && (
              <>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ad headline"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Ad description..."
                    rows={3}
                    maxLength={280}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target URL (optional)</Label>
                  <Input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Placement</Label>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Placements</SelectItem>
                  <SelectItem value="feed">Feed Only</SelectItem>
                  <SelectItem value="search">Search Results</SelectItem>
                  <SelectItem value="featured">Featured Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Daily Budget (ACoin)</Label>
              <Input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                min={10}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 ACoin per day. Your balance: {userAcoin}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={creating}>
              {creating ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdManager;
