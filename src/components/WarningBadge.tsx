import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WarningBadgeProps {
  className?: string;
  showText?: boolean;
  reason?: string | null;
  size?: 'sm' | 'md';
}

export function WarningBadge({ className = '', showText = false, reason, size = 'md' }: WarningBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-0.5 text-amber-500 flex-shrink-0 ${className}`}>
            <AlertTriangle className={`${iconSize} fill-amber-500/20`} />
            {showText && <span className={`${textSize} font-medium`}>Warned</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <p className="text-xs font-medium text-amber-500">⚠️ Account Warning</p>
          <p className="text-xs mt-1">
            {reason || 'This account has been warned by moderators for violating community guidelines.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
