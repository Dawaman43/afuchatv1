import { Skeleton } from '@/components/ui/skeleton';

export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <div className="h-14 border-b border-border flex items-center px-4 gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-5 w-32" />
    </div>
    
    {/* Banner */}
    <Skeleton className="h-32 w-full" />
    
    {/* Profile Info */}
    <div className="px-4 -mt-12 relative">
      <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
      
      <div className="mt-3 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full max-w-xs" />
        
        {/* Stats */}
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      
      {/* Action Button */}
      <Skeleton className="h-9 w-24 rounded-full mt-4" />
    </div>
    
    {/* Tabs */}
    <div className="flex gap-4 px-4 mt-6 border-b border-border">
      <Skeleton className="h-10 w-16" />
      <Skeleton className="h-10 w-16" />
      <Skeleton className="h-10 w-16" />
    </div>
    
    {/* Posts */}
    <div className="divide-y divide-border/30">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);
