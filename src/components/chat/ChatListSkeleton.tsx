import { Skeleton } from '@/components/ui/skeleton';

const ChatItemSkeleton = () => (
  <div className="flex items-center gap-3 p-3 border-b border-border/30">
    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-3 w-full max-w-[200px]" />
    </div>
  </div>
);

export const ChatListSkeleton = () => (
  <div className="divide-y divide-border/30">
    {Array.from({ length: 8 }).map((_, i) => (
      <ChatItemSkeleton key={i} />
    ))}
  </div>
);
