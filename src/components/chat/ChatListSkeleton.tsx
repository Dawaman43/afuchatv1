import { SectionLoader } from '@/components/ui/CustomLoader';

export const ChatListSkeleton = () => (
  <div className="min-h-[50vh]">
    <SectionLoader text="Loading chats..." />
  </div>
);
