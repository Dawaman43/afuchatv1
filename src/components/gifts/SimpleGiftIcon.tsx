import React from 'react';

interface SimpleGiftIconProps {
  emoji: string;
  size?: number;
}

export const SimpleGiftIcon: React.FC<SimpleGiftIconProps> = ({
  emoji,
  size = 48
}) => {
  return (
    <div
      className="relative flex items-center justify-center transition-all duration-300 hover:scale-125 hover:drop-shadow-2xl cursor-pointer"
      style={{ fontSize: `${size}px` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <span className="relative filter drop-shadow-lg">{emoji}</span>
    </div>
  );
};
