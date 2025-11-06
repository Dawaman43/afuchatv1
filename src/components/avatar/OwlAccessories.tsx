import React from 'react';
import { AccessoryType } from '@/types/avatar';

interface OwlAccessoriesProps {
  accessories: AccessoryType[];
}

export const OwlAccessories: React.FC<OwlAccessoriesProps> = ({ accessories }) => {
  return (
    <g className="owl-accessories">
      {accessories.includes('crown') && (
        <g className="crown">
          <path 
            d="M 35 28 L 40 18 L 45 23 L 50 15 L 55 23 L 60 15 L 65 23 L 70 15 L 75 23 L 80 18 L 85 28" 
            fill="#fbbf24"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <circle cx="50" cy="20" r="3" fill="#ef4444" />
          <circle cx="60" cy="20" r="3" fill="#ef4444" />
          <circle cx="70" cy="20" r="3" fill="#ef4444" />
        </g>
      )}
      
      {accessories.includes('hat') && !accessories.includes('crown') && (
        <g className="hat">
          <ellipse cx="60" cy="30" rx="30" ry="8" fill="#1f2937" />
          <rect x="40" y="15" width="40" height="15" rx="3" fill="#374151" />
          <rect x="45" y="18" width="30" height="3" fill="#6366f1" />
        </g>
      )}
      
      {accessories.includes('glasses') && (
        <g className="glasses">
          <ellipse 
            cx="47" 
            cy="48" 
            rx="14" 
            ry="12" 
            fill="none" 
            stroke="#1f2937"
            strokeWidth="3"
          />
          <ellipse 
            cx="73" 
            cy="48" 
            rx="14" 
            ry="12" 
            fill="none" 
            stroke="#1f2937"
            strokeWidth="3"
          />
          <line 
            x1="61" 
            y1="48" 
            x2="59" 
            y2="48" 
            stroke="#1f2937" 
            strokeWidth="3"
          />
          {/* Reflections */}
          <ellipse cx="44" cy="45" rx="4" ry="6" fill="#ffffff" opacity="0.5" />
          <ellipse cx="70" cy="45" rx="4" ry="6" fill="#ffffff" opacity="0.5" />
        </g>
      )}
      
      {accessories.includes('scarf') && (
        <g className="scarf">
          <ellipse 
            cx="60" 
            cy="80" 
            rx="28" 
            ry="8" 
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth="1"
          />
          <rect x="70" y="80" width="8" height="20" fill="#ef4444" />
          <rect x="72" y="98" width="4" height="8" fill="#dc2626" />
          <rect x="42" y="80" width="8" height="15" fill="#ef4444" />
          <rect x="44" y="93" width="4" height="6" fill="#dc2626" />
          {/* Scarf pattern */}
          <line x1="50" y1="78" x2="50" y2="82" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
          <line x1="60" y1="78" x2="60" y2="82" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
          <line x1="70" y1="78" x2="70" y2="82" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
        </g>
      )}
      
      {accessories.includes('mask') && (
        <g className="mask">
          <ellipse 
            cx="60" 
            cy="52" 
            rx="35" 
            ry="18" 
            fill="#1f2937"
            opacity="0.9"
          />
          <ellipse cx="47" cy="50" rx="12" ry="14" fill="#374151" />
          <ellipse cx="73" cy="50" rx="12" ry="14" fill="#374151" />
        </g>
      )}
      
      {accessories.includes('badge') && (
        <g className="badge">
          <circle cx="75" cy="60" r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <text 
            x="75" 
            y="64" 
            fontSize="10" 
            fontWeight="bold" 
            textAnchor="middle" 
            fill="#1f2937"
          >
            ✓
          </text>
        </g>
      )}
    </g>
  );
};
