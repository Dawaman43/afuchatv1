import { Skeleton } from '@/components/ui/skeleton';

export const WalletSkeleton = () => (
  <div className="min-h-screen bg-background p-4">
    {/* Header */}
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-6 w-20" />
    </div>
    
    {/* Balance Card */}
    <Skeleton className="h-40 w-full rounded-2xl mb-6" />
    
    {/* Quick Actions */}
    <div className="flex justify-around mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
    
    {/* Transactions */}
    <Skeleton className="h-5 w-32 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);
