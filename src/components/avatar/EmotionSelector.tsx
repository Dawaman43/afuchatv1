import React from 'react';
import { EmotionType } from '@/types/avatar';
import { Smile, Minus, Frown, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmotionSelectorProps {
  selectedEmotion: EmotionType;
  onChange: (emotion: EmotionType) => void;
}

const EMOTIONS: { type: EmotionType; label: string; icon: React.ReactNode }[] = [
  { type: 'smile', label: 'Happy', icon: <Smile className="h-5 w-5" /> },
  { type: 'neutral', label: 'Neutral', icon: <Minus className="h-5 w-5" /> },
  { type: 'serious', label: 'Serious', icon: <Frown className="h-5 w-5" /> },
  { type: 'sleepy', label: 'Sleepy', icon: <Moon className="h-5 w-5" /> },
];

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onChange,
}) => {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Choose your owl's mood</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EMOTIONS.map((emotion) => (
          <Button
            key={emotion.type}
            variant={selectedEmotion === emotion.type ? 'default' : 'outline'}
            onClick={() => onChange(emotion.type)}
            className="flex flex-col items-center gap-2 h-auto py-3"
          >
            {emotion.icon}
            <span className="text-xs">{emotion.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
