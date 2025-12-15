import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
}

export const CommentInput = ({
  postId,
  replyingTo,
  postAuthorHandle,
  onCancelReply,
  onCommentSubmitted,
  className,
}: CommentInputProps) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user profile for avatar
  useState(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setUserProfile(data));
    }
  });

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
    <div className={cn("px-4 py-3 border-t border-border bg-background", className)}>
      {/* Replying indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-muted-foreground">
            Replying to <span className="text-primary font-medium">@{replyingTo.authorHandle}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="h-6 px-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Input area */}
      <div className="flex items-end gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={userProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? `Reply to @${replyingTo.authorHandle}...` : "Write a comment..."}
            className="min-h-[40px] max-h-[120px] resize-none pr-12 py-2.5 rounded-2xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
            rows={1}
          />
          
          <Button
            onClick={handleSubmit}
            disabled={!commentText.trim() || submitting}
            size="icon"
            className="absolute right-1.5 bottom-1.5 h-7 w-7 rounded-full"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
