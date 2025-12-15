import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CommentInputProps {
  postId: string;
  replyingTo?: { replyId: string; authorHandle: string } | null;
  postAuthorHandle?: string;
  onCancelReply?: () => void;
  onCommentSubmitted?: () => void;
  className?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

export const CommentInput = ({
  postId,
  replyingTo,
  postAuthorHandle,
  onCancelReply,
  onCommentSubmitted,
  className,
  compact = false,
  autoFocus = false,
}: CommentInputProps) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile for avatar
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setUserProfile(data));
    }
  }, [user]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const targetHandle = replyingTo?.authorHandle || postAuthorHandle;

  const handleSubmit = async () => {
    if (!commentText.trim() || !user) return;

    setSubmitting(true);
    try {
      // Build content - only add mention if replying to someone else
      let finalContent = commentText.trim();
      
      // Only add mention at the end if we're replying to a specific comment
      // and the mention isn't already in the text
      if (replyingTo) {
        const mention = `@${replyingTo.authorHandle}`;
        if (!finalContent.includes(mention)) {
          finalContent = `${finalContent} ${mention}`;
        }
      }

      const { error } = await supabase
        .from('post_replies')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: finalContent,
          parent_reply_id: replyingTo?.replyId || null,
        });

      if (error) throw error;

      setCommentText('');
      onCancelReply?.();
      onCommentSubmitted?.();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!user) {
    return (
      <div className={cn("px-4 py-3 border-t border-border bg-background", className)}>
        <p className="text-muted-foreground text-center text-sm">Sign in to comment</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 bg-background",
      compact ? "px-3 py-2" : "px-4 py-3 border-t border-border",
      className
    )}>
      {/* Avatar */}
      <Avatar className={cn(compact ? "h-8 w-8" : "h-10 w-10", "flex-shrink-0")}>
        <AvatarImage src={userProfile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {user.email?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      {/* Input with mention placeholder */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={targetHandle ? `@${targetHandle}` : "Write a comment..."}
          className={cn(
            "w-full bg-muted/50 border border-border/50 rounded-full px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
            compact ? "h-9 py-2" : "h-11 py-2.5"
          )}
        />
      </div>
      
      {/* Reply button */}
      <Button
        onClick={handleSubmit}
        disabled={!commentText.trim() || submitting}
        variant="ghost"
        size="sm"
        className={cn(
          "font-semibold text-primary hover:text-primary/80 hover:bg-transparent px-2",
          (!commentText.trim() || submitting) && "opacity-50"
        )}
      >
        {submitting ? '...' : 'Reply'}
      </Button>
    </div>
  );
};
