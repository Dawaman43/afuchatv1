import { SectionLoader } from '@/components/ui/CustomLoader';

export const FeedSkeleton = () => (
  <div className="min-h-[50vh]">
    <SectionLoader text="Loading feed..." />
  </div>
);
