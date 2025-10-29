import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Heart, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    display_name: string;
    handle: string;
    is_verified?: boolean;
  };
}

// --- Twitter Verified Badge (from Wikipedia) ---
const TwitterVerifiedBadge = () => (
  <svg
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    className="inline w-[16px] h-[16px] ml-0.5"
  >
    <path
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      fill="#1d9bf0"
    />
  </svg>
);

const timeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = {
            ...payload.new,
            profiles: {
              display_name: user?.user_metadata?.display_name || 'User',
              handle: user?.user_metadata?.handle || 'user',
              is_verified: user?.user_metadata?.is_verified || false,
            },
          } as Post;
          setPosts((cur) => [newPost, ...cur]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(display_name, handle, is_verified)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setPosts(data as Post[]);
    } catch (err) {
      console.error('Error fetching posts:', err);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const PostSkeleton = () => (
    <div className="p-4 border-b border-border bg-card space-y-3 animate-pulse">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-full bg-muted" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-1/3 bg-muted" />
          <Skeleton className="h-3 w-1/4 bg-muted" />
        </div>
        <Skeleton className="h-3 w-12 bg-muted" />
      </div>
      <Skeleton className="h-4 w-full bg-muted" />
      <Skeleton className="h-4 w-5/6 bg-muted" />
      <div className="flex space-x-8">
        <Skeleton className="h-4 w-4 bg-muted rounded-full" />
        <Skeleton className="h-4 w-4 bg-muted rounded-full" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full space-y-0 p-4">
        {[...Array(5)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  const PostCard = ({ post }: { post: Post }) => {
    const timeLabel = timeAgo(post.created_at);

    return (
      <div className="p-4 border-b border-border bg-card hover:bg-card/90 transition-colors">
        {/* Post Header */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
            <User className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="font-bold text-sm text-foreground truncate flex items-center gap-0.5">
                {post.profiles.display_name}
                {post.profiles.is_verified && <TwitterVerifiedBadge />}
              </span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                @{post.profiles.handle}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {timeLabel}
            </span>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">
          {post.content}
        </p>

        {/* Post Footer */}
        <div className="flex justify-between space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-primary transition-colors p-1 -m-1 rounded-full hover:bg-primary/10">
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Reply</span>
            </button>
            <button className="flex items-center gap-1 hover:text-primary transition-colors p-1 -m-1 rounded-full hover:bg-primary/10">
              <Heart className="h-5 w-5" />
              <span className="hidden sm:inline">Like</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Placeholder for views or other actions */}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto space-y-0 px-4 py-2">
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 flex flex-col items-center">
            <User className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-sm">No posts yet.</p>
            <p className="text-xs mt-1">Tap the compose button to share your first post!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
