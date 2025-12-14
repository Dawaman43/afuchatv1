import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatRoomSkeletonProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export const ChatRoomSkeleton = ({ isEmbedded = false, onBack }: ChatRoomSkeletonProps) => {
  return (
    <div className={`flex flex-col bg-background ${isEmbedded ? 'h-full relative' : 'fixed inset-0'}`}>
      {/* Header Skeleton */}
      <header className="flex-shrink-0 flex items-center gap-3 px-3 py-3 bg-background border-b border-border z-10 pt-[env(safe-area-inset-top)]">
        {!isEmbedded && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-muted/50"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        
        <Skeleton className="h-8 w-8 rounded-full" />
      </header>

      {/* Messages Area Skeleton */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Incoming messages */}
        <div className="flex items-end gap-2 max-w-[85%]">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-14 w-48 rounded-2xl rounded-bl-md" />
          </div>
        </div>
        
        {/* Outgoing message */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40 rounded-2xl rounded-br-md bg-primary/20" />
        </div>
        
        {/* More incoming */}
        <div className="flex items-end gap-2 max-w-[85%]">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-56 rounded-2xl rounded-bl-md" />
          </div>
        </div>
        
        {/* More outgoing */}
        <div className="flex justify-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-32 rounded-2xl rounded-br-md bg-primary/20" />
            <Skeleton className="h-16 w-52 rounded-2xl rounded-br-md bg-primary/20" />
          </div>
        </div>
        
        {/* Incoming */}
        <div className="flex items-end gap-2 max-w-[85%]">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <Skeleton className="h-12 w-36 rounded-2xl rounded-bl-md" />
        </div>
        
        {/* More messages */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-44 rounded-2xl rounded-br-md bg-primary/20" />
        </div>
        
        <div className="flex items-end gap-2 max-w-[85%]">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <Skeleton className="h-24 w-60 rounded-2xl rounded-bl-md" />
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="flex-shrink-0 bg-background border-t border-border px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
};
