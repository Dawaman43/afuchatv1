import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAITranslation } from '@/hooks/useAITranslation';
import { MessageSquare, Pin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WarningBadge } from '@/components/WarningBadge';

interface Reply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_reply_id?: string | null;
  is_pinned?: boolean;
  pinned_by?: string | null;
  pinned_at?: string | null;
  nested_replies?: Reply[];
  profiles: {
    display_name: string;
    handle: string;
    is_verified: boolean;
    is_organization_verified: boolean;
    avatar_url?: string | null;
    last_seen?: string | null;
    show_online_status?: boolean;
    is_warned?: boolean;
    warning_reason?: string | null;
  };
}

interface FeedNestedReplyItemProps {
  reply: Reply;
  depth: number;
  handleViewProfile: (id: string) => void;
  onReplyToReply: (parentReplyId: string, content: string) => void;
  onPinReply: (replyId: string, currentPinnedState: boolean) => void;
  onDeleteReply: (replyId: string) => void;
  isPostAuthor: boolean;
  currentUserId?: string;
  parsePostContent: (content: string, navigate: any) => React.ReactNode;
  formatTime: (time: string) => string;
  UserAvatarSmall: React.ComponentType<{
    userId: string;
    name: string;
    avatarUrl?: string | null;
    lastSeen?: string | null;
    showOnlineStatus?: boolean;
  }>;
  VerifiedBadge: React.ComponentType<{
    isVerified: boolean;
    isOrgVerified: boolean;
  }>;
}

const MAX_DEPTH = 3;

export const FeedNestedReplyItem = ({
  reply,
  depth,
  handleViewProfile,
  onReplyToReply,
  onPinReply,
  onDeleteReply,
  isPostAuthor,
  currentUserId,
  parsePostContent,
  formatTime,
  UserAvatarSmall,
  VerifiedBadge,
}: FeedNestedReplyItemProps) => {
  const { i18n, t } = useTranslation();
  const { translateText } = useAITranslation();
  const navigate = useNavigate();
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleTranslate = async () => {
    if (translatedContent) {
      setTranslatedContent(null);
      return;
    }
    setIsTranslating(true);
    const contentToTranslate = typeof reply.content === 'string' ? reply.content : String(reply.content || '');
    const translated = await translateText(contentToTranslate, i18n.language);
    setTranslatedContent(translated);
    setIsTranslating(false);
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReplyToReply(reply.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const displayContent = translatedContent || (typeof reply.content === 'string' ? reply.content : String(reply.content || ''));

  return (
    <div className={cn(
      "relative py-2",
      depth > 0 && "ml-8 pl-3 border-l-2 border-border"
    )}>
      {reply.is_pinned && (
        <div className="flex items-center gap-1 text-[10px] text-primary font-medium mb-1">
          <Pin className="h-3 w-3" />
          <span>Pinned by author</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={() => handleViewProfile(reply.author_id)}
        >
          <UserAvatarSmall 
            userId={reply.author_id} 
            name={reply.profiles.display_name}
            avatarUrl={reply.profiles.avatar_url}
            lastSeen={reply.profiles.last_seen}
            showOnlineStatus={reply.profiles.show_online_status}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className="font-semibold text-foreground text-xs cursor-pointer hover:underline"
              onClick={() => handleViewProfile(reply.author_id)}
            >
              {reply.profiles.display_name}
            </span>
            <VerifiedBadge 
              isVerified={reply.profiles.is_verified} 
              isOrgVerified={reply.profiles.is_organization_verified} 
            />
            {reply.profiles.is_warned && (
              <WarningBadge size="sm" reason={reply.profiles.warning_reason} variant="post" />
            )}
            <span
              className="text-muted-foreground text-xs cursor-pointer hover:underline truncate"
              onClick={() => handleViewProfile(reply.author_id)}
            >
              @{reply.profiles.handle}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">
              {formatTime(reply.created_at)}
            </span>
          </div>

          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words mt-0.5">
            {parsePostContent(displayContent, navigate)}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            {depth < MAX_DEPTH && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                Reply
              </Button>
            )}
            
            {i18n.language !== 'en' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
              >
                {isTranslating ? t('common.translating') : translatedContent ? t('common.showOriginal') : t('common.translate')}
              </Button>
            )}
            
            {isPostAuthor && depth === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPinReply(reply.id, reply.is_pinned || false)}
                className={cn(
                  "h-6 px-2 text-xs gap-1",
                  reply.is_pinned ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <Pin className="h-3 w-3" />
                {reply.is_pinned ? 'Unpin' : 'Pin'}
              </Button>
            )}
            
            {currentUserId && (currentUserId === reply.author_id || isPostAuthor) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Delete this comment?')) {
                    onDeleteReply(reply.id);
                  }
                }}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            )}
          </div>

          {showReplyInput && (
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
                placeholder={`Reply to ${reply.profiles.display_name}...`}
                className="flex-1 h-8 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="h-8 px-3 text-xs"
              >
                Post
              </Button>
            </div>
          )}

          {/* Render nested replies */}
          {reply.nested_replies && reply.nested_replies.length > 0 && (
            <div className="mt-2">
              {reply.nested_replies.map((nestedReply) => (
                <FeedNestedReplyItem
                  key={nestedReply.id}
                  reply={nestedReply}
                  depth={depth + 1}
                  handleViewProfile={handleViewProfile}
                  onReplyToReply={onReplyToReply}
                  onPinReply={onPinReply}
                  onDeleteReply={onDeleteReply}
                  isPostAuthor={isPostAuthor}
                  currentUserId={currentUserId}
                  parsePostContent={parsePostContent}
                  formatTime={formatTime}
                  UserAvatarSmall={UserAvatarSmall}
                  VerifiedBadge={VerifiedBadge}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
