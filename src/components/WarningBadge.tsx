import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WarningBadgeProps {
  className?: string;
  showText?: boolean;
}

export function WarningBadge({ className = '', showText = false }: WarningBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 text-amber-500 ${className}`}>
            <AlertTriangle className="h-4 w-4 fill-amber-500/20" />
            {showText && <span className="text-xs font-medium">Warned</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">This account has been warned by moderators</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
