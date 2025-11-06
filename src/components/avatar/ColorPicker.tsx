import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  optional?: boolean;
}

const PRESET_COLORS = [
  '#7456E8', // Purple (default)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  label, 
  color, 
  onChange,
  optional = false
}) => {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Preset Colors */}
      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map((presetColor) => (
          <button
            key={presetColor}
            onClick={() => onChange(presetColor)}
            className={`h-10 w-full rounded-lg border-2 transition-all hover:scale-105 ${
              color === presetColor ? 'border-primary ring-2 ring-primary/20' : 'border-border'
            }`}
            style={{ backgroundColor: presetColor }}
            aria-label={`Select ${presetColor}`}
          />
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={color || '#7456E8'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 cursor-pointer"
        />
        <Input
          type="text"
          value={color || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={optional ? 'Optional' : '#7456E8'}
          className="flex-1"
          maxLength={7}
        />
      </div>
    </div>
  );
};
