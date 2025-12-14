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

interface PostData {
  content: string;
  image_url: string | null;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    handle: string;
  };
  post_images: { image_url: string }[];
}

export const SponsoredAdCard = ({ ad, placement, variant = 'feed' }: SponsoredAdCardProps) => {
  const [clicked, setClicked] = useState(false);
  const [advertiser, setAdvertiser] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [postData, setPostData] = useState<PostData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // For promoted posts, fetch the actual post content
      if (ad.ad_type === 'promoted_post' && ad.post_id) {
        const { data: post } = await supabase
          .from('posts')
          .select(`
            content,
            image_url,
            profiles!posts_author_id_fkey(display_name, avatar_url, handle),
            post_images(image_url)
          `)
          .eq('id', ad.post_id)
          .single();
        
        if (post) {
          setPostData(post as unknown as PostData);
        }
      } else {
        // For custom ads, fetch advertiser info
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', ad.user_id)
          .single();
        if (data) setAdvertiser(data);
      }
    };
    fetchData();
  }, [ad.user_id, ad.ad_type, ad.post_id]);

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

  // Determine display content
  const displayName = postData?.profiles?.display_name || advertiser?.display_name || 'Advertiser';
  const avatarUrl = postData?.profiles?.avatar_url || advertiser?.avatar_url;
  const displayContent = ad.content || postData?.content;
  const displayTitle = ad.title;
  const displayImage = ad.image_url || postData?.image_url || postData?.post_images?.[0]?.image_url;

  const PostContent = (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border">
      {/* Header with advertiser info and sponsored badge */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <Megaphone className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[15px] text-foreground">
              {displayName}
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
          {displayTitle && (
            <h4 className="font-medium text-[15px] text-foreground mt-1">{displayTitle}</h4>
          )}
          
          {/* Ad Content */}
          {displayContent && (
            <p className="text-[15px] text-foreground mt-1 whitespace-pre-wrap">{displayContent}</p>
          )}
          
          {/* Ad Image */}
          {displayImage && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border">
              <img 
                src={displayImage} 
                alt={displayTitle || 'Sponsored content'}
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
