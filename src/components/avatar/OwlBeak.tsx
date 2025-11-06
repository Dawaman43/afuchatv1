import React from 'react';
import { EmotionType } from '@/types/avatar';

interface OwlBeakProps {
  emotion: EmotionType;
}

export const OwlBeak: React.FC<OwlBeakProps> = ({ emotion }) => {
  return (
    <g className="owl-beak">
      {/* Beak */}
      <path 
        d="M 60 58 L 54 65 L 60 68 L 66 65 Z" 
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth="1"
      />
      
      {/* Mouth based on emotion */}
      {emotion === 'smile' && (
        <path 
          d="M 50 72 Q 60 78 70 72" 
          stroke="#1a1a1a" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round"
        />
      )}
      
      {emotion === 'neutral' && (
        <line 
          x1="50" 
          y1="74" 
          x2="70" 
          y2="74" 
          stroke="#1a1a1a" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      )}
      
      {emotion === 'serious' && (
        <path 
          d="M 50 76 Q 60 72 70 76" 
          stroke="#1a1a1a" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round"
        />
      )}
      
      {emotion === 'sleepy' && (
        <path 
          d="M 55 74 Q 60 76 65 74" 
          stroke="#1a1a1a" 
          strokeWidth="1.5" 
          fill="none" 
          strokeLinecap="round"
          opacity="0.6"
        />
      )}
    </g>
  );
};
