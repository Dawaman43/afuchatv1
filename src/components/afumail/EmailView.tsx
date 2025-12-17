import React, { useMemo } from 'react';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { 
  ArrowLeft, 
  Star, 
  Reply, 
  Forward, 
  Trash2, 
  Archive, 
  MoreVertical,
  Paperclip,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { EmailDetail, Attachment } from '@/hooks/useAfuMail';

interface EmailViewProps {
  email: EmailDetail | null;
  loading?: boolean;
  onBack: () => void;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
  onStar: () => void;
  onArchive: () => void;
  onMarkUnread: () => void;
}

function extractSenderInfo(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: from.split('@')[0], email: from };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function AttachmentItem({ attachment }: { attachment: Attachment }) {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="p-2 rounded bg-primary/10">
        <Paperclip className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}

// Sanitize email HTML to prevent XSS attacks
function SafeEmailBody({ htmlContent, textContent }: { htmlContent?: string; textContent?: string }) {
  const sanitizedHtml = useMemo(() => {
    const content = htmlContent || textContent || '';
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'pre', 'code'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'width', 'height'],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'], // Ensure links open in new tab
    });
  }, [htmlContent, textContent]);

  return (
    <div 
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export function EmailView({
  email,
  loading,
  onBack,
  onReply,
  onForward,
  onDelete,
  onStar,
  onArchive,
  onMarkUnread,
}: EmailViewProps) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select an email to read</p>
      </div>
    );
  }

  const sender = extractSenderInfo(email.from);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onStar}>
            <Star className={cn(
              "h-5 w-5",
              email.starred ? "fill-yellow-400 text-yellow-400" : ""
            )} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onArchive}>
            <Archive className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onMarkUnread}>
              Mark as unread
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onForward}>
              Forward
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Subject */}
          <h1 className="text-xl font-semibold mb-4">
            {email.subject || '(No subject)'}
          </h1>

          {/* Sender info */}
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(sender.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{sender.name}</span>
                <span className="text-sm text-muted-foreground">&lt;{sender.email}&gt;</span>
              </div>
              <div className="text-sm text-muted-foreground">
                to {email.to.join(', ')}
                {email.cc && email.cc.length > 0 && (
                  <span>, cc: {email.cc.join(', ')}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(email.timestamp), 'PPpp')}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {email.attachments.map((attachment) => (
                  <AttachmentItem key={attachment.id} attachment={attachment} />
                ))}
              </div>
            </div>
          )}

          {/* Email body - sanitized to prevent XSS */}
          <SafeEmailBody htmlContent={email.body_html} textContent={email.body_text} />
        </div>
      </div>

      {/* Reply actions */}
      <div className="border-t border-border p-4 flex gap-2 shrink-0">
        <Button onClick={onReply} className="flex-1">
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
        <Button variant="outline" onClick={onForward}>
          <Forward className="h-4 w-4 mr-2" />
          Forward
        </Button>
      </div>
    </div>
  );
}
