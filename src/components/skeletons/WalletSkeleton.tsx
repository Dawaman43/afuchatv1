import { SectionLoader } from '@/components/ui/CustomLoader';

export const WalletSkeleton = () => (
  <div className="min-h-screen bg-background">
    <SectionLoader text="Loading wallet..." />
  </div>
);
