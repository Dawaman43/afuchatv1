import { SectionLoader } from '@/components/ui/CustomLoader';

export const NotificationsSkeleton = () => (
  <div className="min-h-screen bg-background">
    <SectionLoader text="Loading notifications..." />
  </div>
);
