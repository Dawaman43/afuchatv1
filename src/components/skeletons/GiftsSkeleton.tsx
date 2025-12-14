import { Skeleton } from '@/components/ui/skeleton';

export const GiftsSkeleton = () => (
  <div className="min-h-screen bg-background p-4">
    {/* Header */}
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-6 w-20" />
    </div>
    
    {/* Balance Card */}
    <Skeleton className="h-24 w-full rounded-xl mb-6" />
    
    {/* Categories */}
    <div className="flex gap-2 mb-6 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
      ))}
    </div>
    
    {/* Gift Grid */}
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);
