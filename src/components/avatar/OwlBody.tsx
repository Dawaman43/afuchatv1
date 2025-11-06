import React from 'react';

interface OwlBodyProps {
  color: string;
  featherColor: string;
}

export const OwlBody: React.FC<OwlBodyProps> = ({ color, featherColor }) => {
  return (
    <g className="owl-body">
      {/* Main body */}
      <ellipse cx="60" cy="65" rx="35" ry="40" fill={color} />
      
      {/* Chest/belly - lighter area */}
      <ellipse cx="60" cy="70" rx="22" ry="28" fill="#ffffff" fillOpacity="0.3" />
      
      {/* Wings */}
      <ellipse cx="32" cy="65" rx="12" ry="25" fill={featherColor} />
      <ellipse cx="88" cy="65" rx="12" ry="25" fill={featherColor} />
      
      {/* Wing details */}
      <path 
        d="M 32 55 Q 28 65 32 75" 
        stroke="#ffffff" 
        strokeWidth="2" 
        fill="none" 
        opacity="0.4"
      />
      <path 
        d="M 88 55 Q 92 65 88 75" 
        stroke="#ffffff" 
        strokeWidth="2" 
        fill="none" 
        opacity="0.4"
      />
      
      {/* Feet */}
      <g className="owl-feet">
        {/* Left foot */}
        <ellipse cx="50" cy="100" rx="6" ry="4" fill="#f59e0b" />
        <line x1="47" y1="100" x2="45" y2="105" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="100" x2="50" y2="106" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="53" y1="100" x2="55" y2="105" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        
        {/* Right foot */}
        <ellipse cx="70" cy="100" rx="6" ry="4" fill="#f59e0b" />
        <line x1="67" y1="100" x2="65" y2="105" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="100" x2="70" y2="106" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="73" y1="100" x2="75" y2="105" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Ear tufts */}
      <path 
        d="M 35 30 Q 32 25 35 20" 
        stroke={featherColor} 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round"
      />
      <path 
        d="M 85 30 Q 88 25 85 20" 
        stroke={featherColor} 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round"
      />
    </g>
  );
};
