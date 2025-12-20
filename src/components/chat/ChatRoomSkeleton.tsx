import { SectionLoader } from '@/components/ui/CustomLoader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatRoomSkeletonProps {
  isEmbedded?: boolean;
  onBack?: () => void;
}

export const ChatRoomSkeleton = ({ isEmbedded = false, onBack }: ChatRoomSkeletonProps) => {
  return (
    <div className={`flex flex-col bg-background ${isEmbedded ? 'h-full relative' : 'fixed inset-0'}`}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-3 py-3 bg-background border-b border-border z-10 pt-[env(safe-area-inset-top)]">
        {!isEmbedded && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-muted/50"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </header>

      {/* Loading Content */}
      <div className="flex-1 flex items-center justify-center">
        <SectionLoader text="Loading messages..." />
      </div>

      {/* Input Area Placeholder */}
      <div className="flex-shrink-0 bg-background border-t border-border px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="h-10" />
      </div>
    </div>
  );
};
