import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the types
interface Post {
  id: string;
  content: string;
  created_at: string;
  author: {
    display_name: string;
    handle: string;
  };
}

const PostDetail = () => {
  const { postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at,
          author:profiles!author_id (display_name, handle)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
      } else {
        setPost(data as any);
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Link to="/">
          <Button variant="link">Go home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link to="/" className="mb-4">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>
      <div className="mt-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{post.author.display_name}</h2>
          <p className="text-sm text-muted-foreground">@{post.author.handle}</p>
        </div>
        <p className="text-lg whitespace-pre-wrap">{post.content}</p>
        <p className="text-xs text-muted-foreground mt-4">
          {new Date(post.created_at).toLocaleString('en-UG')}
        </p>
      </div>
    </div>
  );
};

export default PostDetail;
