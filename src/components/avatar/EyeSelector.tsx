import React from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EyeSelectorProps {
  selectedEyes: 'normal' | 'sleepy' | 'wide';
  onChange: (eyes: 'normal' | 'sleepy' | 'wide') => void;
}

const EYE_TYPES: { type: 'normal' | 'sleepy' | 'wide'; label: string; icon: React.ReactNode }[] = [
  { type: 'normal', label: 'Normal', icon: <Eye className="h-5 w-5" /> },
  { type: 'sleepy', label: 'Sleepy', icon: <EyeOff className="h-5 w-5" /> },
  { type: 'wide', label: 'Wide', icon: <Sparkles className="h-5 w-5" /> },
];

export const EyeSelector: React.FC<EyeSelectorProps> = ({
  selectedEyes,
  onChange,
}) => {
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground mb-3">Eye style</p>
      <div className="grid grid-cols-3 gap-2">
        {EYE_TYPES.map((eyeType) => (
          <Button
            key={eyeType.type}
            variant={selectedEyes === eyeType.type ? 'default' : 'outline'}
            onClick={() => onChange(eyeType.type)}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            {eyeType.icon}
            <span className="text-xs">{eyeType.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
