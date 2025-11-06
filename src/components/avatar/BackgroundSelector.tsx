import React from 'react';
import { Sun, Palette, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackgroundSelectorProps {
  selectedBackground: 'light' | 'gradient' | 'transparent';
  onChange: (background: 'light' | 'gradient' | 'transparent') => void;
}

const BACKGROUNDS: { 
  type: 'light' | 'gradient' | 'transparent'; 
  label: string; 
  icon: React.ReactNode;
  preview: string;
}[] = [
  { 
    type: 'light', 
    label: 'Light', 
    icon: <Sun className="h-5 w-5" />,
    preview: 'bg-slate-100'
  },
  { 
    type: 'gradient', 
    label: 'Gradient', 
    icon: <Palette className="h-5 w-5" />,
    preview: 'bg-gradient-to-br from-purple-400 to-blue-500'
  },
  { 
    type: 'transparent', 
    label: 'None', 
    icon: <Circle className="h-5 w-5" />,
    preview: 'bg-transparent border-2 border-dashed border-muted-foreground/20'
  },
];

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {BACKGROUNDS.map((bg) => (
        <Button
          key={bg.type}
          variant={selectedBackground === bg.type ? 'default' : 'outline'}
          onClick={() => onChange(bg.type)}
          className="flex flex-col items-center gap-3 h-auto py-4"
        >
          <div className={`h-12 w-12 rounded-lg ${bg.preview}`} />
          <div className="flex flex-col items-center gap-1">
            {bg.icon}
            <span className="text-xs">{bg.label}</span>
          </div>
        </Button>
      ))}
    </div>
  );
};
