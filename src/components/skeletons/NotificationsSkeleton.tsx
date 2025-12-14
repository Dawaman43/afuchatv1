import { Skeleton } from '@/components/ui/skeleton';

const NotificationItemSkeleton = () => (
  <div className="flex items-start gap-3 p-4 border-b border-border/30">
    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-full max-w-[250px]" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const NotificationsSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <div className="h-14 border-b border-border flex items-center justify-between px-4">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    
    {/* Notifications List */}
    <div className="divide-y divide-border/30">
      {Array.from({ length: 8 }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  </div>
);
