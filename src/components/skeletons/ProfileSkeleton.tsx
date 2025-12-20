import { SectionLoader } from '@/components/ui/CustomLoader';

export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    <SectionLoader text="Loading profile..." />
  </div>
);
