import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SponsoredAdCardProps {
  ad: {
    id: string;
    ad_type: string;
    title: string | null;
    content: string | null;
    image_url: string | null;
    target_url: string | null;
    post_id: string | null;
    user_id: string;
  };
  placement: string;
  variant?: 'feed' | 'search' | 'featured';
}

export const SponsoredAdCard = ({ ad, placement, variant = 'feed' }: SponsoredAdCardProps) => {
  const [clicked, setClicked] = useState(false);
  const [advertiser, setAdvertiser] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchAdvertiser = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', ad.user_id)
        .single();
      if (data) setAdvertiser(data);
    };
    fetchAdvertiser();
  }, [ad.user_id]);

  const handleImpression = async () => {
    try {
      await supabase.rpc('record_ad_impression', {
        p_ad_id: ad.id,
        p_placement: placement
      });
    } catch (error) {
      console.error('Failed to record impression:', error);
    }
  };

  const handleClick = async () => {
    if (clicked) return;
    setClicked(true);
    
    try {
      await supabase.rpc('record_ad_click', {
        p_ad_id: ad.id,
        p_placement: placement
      });
    } catch (error) {
      console.error('Failed to record click:', error);
    }
  };

  // Record impression on mount
  useEffect(() => {
    handleImpression();
  }, []);

  const PostContent = (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border">
      {/* Header with advertiser info and sponsored badge */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={advertiser?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <Megaphone className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[15px] text-foreground">
              {advertiser?.display_name || 'Advertiser'}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 font-medium">
              <Megaphone className="h-2.5 w-2.5 mr-1" />
              Sponsored
            </Badge>
            {ad.target_url && (
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          
          {/* Ad Title */}
          {ad.title && (
            <h4 className="font-medium text-[15px] text-foreground mt-1">{ad.title}</h4>
          )}
          
          {/* Ad Content */}
          {ad.content && (
            <p className="text-[15px] text-foreground mt-1 whitespace-pre-wrap">{ad.content}</p>
          )}
          
          {/* Ad Image */}
          {ad.image_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border">
              <img 
                src={ad.image_url} 
                alt={ad.title || 'Sponsored content'}
                className="w-full object-cover max-h-80"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (ad.ad_type === 'promoted_post' && ad.post_id) {
    return (
      <Link to={`/post/${ad.post_id}`} onClick={handleClick}>
        {PostContent}
      </Link>
    );
  }

  if (ad.target_url) {
    return (
      <a 
        href={ad.target_url.startsWith('http') ? ad.target_url : `https://${ad.target_url}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {PostContent}
      </a>
    );
  }

  return <div onClick={handleClick}>{PostContent}</div>;
};

export default SponsoredAdCard;
