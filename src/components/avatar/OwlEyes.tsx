import React from 'react';

interface OwlEyesProps {
  type: 'normal' | 'sleepy' | 'wide';
  eyeColor: string;
}

export const OwlEyes: React.FC<OwlEyesProps> = ({ type, eyeColor }) => {
  if (type === 'sleepy') {
    return (
      <g className="owl-eyes sleepy">
        {/* Closed eyes */}
        <path 
          d="M 40 48 Q 48 50 55 48" 
          stroke={eyeColor} 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
        />
        <path 
          d="M 65 48 Q 72 50 80 48" 
          stroke={eyeColor} 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
        />
        {/* Eyelashes */}
        <line x1="42" y1="47" x2="40" y2="44" stroke={eyeColor} strokeWidth="1.5" />
        <line x1="53" y1="47" x2="55" y2="44" stroke={eyeColor} strokeWidth="1.5" />
        <line x1="67" y1="47" x2="65" y2="44" stroke={eyeColor} strokeWidth="1.5" />
        <line x1="78" y1="47" x2="80" y2="44" stroke={eyeColor} strokeWidth="1.5" />
      </g>
    );
  }

  const eyeWidth = type === 'wide' ? 18 : 16;
  const eyeHeight = type === 'wide' ? 22 : 20;
  const pupilSize = type === 'wide' ? 9 : 7;

  return (
    <g className="owl-eyes">
      {/* White part of eyes */}
      <ellipse cx="47" cy="48" rx={eyeWidth} ry={eyeHeight} fill="#ffffff" />
      <ellipse cx="73" cy="48" rx={eyeWidth} ry={eyeHeight} fill="#ffffff" />
      
      {/* Eye outline */}
      <ellipse 
        cx="47" 
        cy="48" 
        rx={eyeWidth} 
        ry={eyeHeight} 
        fill="none" 
        stroke={eyeColor}
        strokeWidth="2"
      />
      <ellipse 
        cx="73" 
        cy="48" 
        rx={eyeWidth} 
        ry={eyeHeight} 
        fill="none" 
        stroke={eyeColor}
        strokeWidth="2"
      />
      
      {/* Pupils */}
      <circle cx="47" cy="50" r={pupilSize} fill={eyeColor} />
      <circle cx="73" cy="50" r={pupilSize} fill={eyeColor} />
      
      {/* Light reflection in eyes */}
      <circle cx="44" cy="47" r="3" fill="#ffffff" opacity="0.8" />
      <circle cx="70" cy="47" r="3" fill="#ffffff" opacity="0.8" />
      
      {/* Eyebrows (more pronounced for wide eyes) */}
      {type === 'wide' && (
        <>
          <path 
            d="M 35 40 Q 47 35 55 38" 
            stroke={eyeColor} 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round"
          />
          <path 
            d="M 65 38 Q 73 35 85 40" 
            stroke={eyeColor} 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
};
