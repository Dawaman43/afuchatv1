import { SectionLoader } from '@/components/ui/CustomLoader';

export const GiftsSkeleton = () => (
  <div className="min-h-screen bg-background">
    <SectionLoader text="Loading gifts..." />
  </div>
);
