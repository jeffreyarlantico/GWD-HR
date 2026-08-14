import React, { useState } from 'react';
import districtLogoImg from '../../assets/images/guimba_west_district_logo_1786539610233.jpg';

interface DistrictLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export const DistrictLogo: React.FC<DistrictLogoProps> = ({ 
  size = 'md', 
  className = '',
  showBorder = true 
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const containerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white ${
        showBorder ? 'ring-2 ring-amber-400/80 shadow-md' : ''
      } ${containerSize} ${className}`}
    >
      {!imgError ? (
        <img
          src={districtLogoImg}
          alt="Purok ng Kanlurang Guimba Seal"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        // High-fidelity SVG Vector Fallback of the Guimba West District Seal
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full"
          aria-label="Purok ng Kanlurang Guimba Logo"
        >
          {/* Outer Navy Ring */}
          <circle cx="100" cy="100" r="96" fill="#032B5B" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="#032B5B" strokeWidth="3" />
          <circle cx="100" cy="100" r="76" fill="#FFFFFF" />

          {/* Circular Text */}
          <path id="textPathOuter" d="M 22,100 A 78,78 0 1,1 178,100" fill="none" />
          <text fill="#032B5B" fontSize="13" fontWeight="900" letterSpacing="1">
            <textPath href="#textPathOuter" startOffset="50%" textAnchor="middle">
              PUROK NG KANLURANG GUIMBA
            </textPath>
          </text>

          <path id="textPathInner" d="M 178,100 A 78,78 0 0,1 22,100" fill="none" />
          <text fill="#032B5B" fontSize="12" fontWeight="900" letterSpacing="1">
            <textPath href="#textPathInner" startOffset="50%" textAnchor="middle">
              • KAGAWARAN NG EDUKASYON •
            </textPath>
          </text>

          {/* Inner Seal Graphics */}
          {/* Torch Flame */}
          <path d="M 100,32 C 105,42 114,46 108,58 C 105,53 98,52 96,44 C 92,54 86,50 88,38 C 93,42 97,36 100,32 Z" fill="#E63946" />
          <path d="M 100,36 C 102,42 108,44 104,52 C 102,48 97,47 96,42 C 94,48 91,46 92,39 C 95,42 98,38 100,36 Z" fill="#FFB703" />

          {/* Torch Stem & Cup */}
          <path d="M 90,58 L 110,58 L 106,66 L 94,66 Z" fill="#2A9D8F" />
          <path d="M 97,66 L 103,66 L 101,160 L 99,160 Z" fill="#2A9D8F" />

          {/* Golden Rice Stalk (G) */}
          <path d="M 55,100 Q 52,125 75,140 Q 82,143 85,135 Q 70,125 68,105 Q 67,90 75,78" fill="none" stroke="#FFB703" strokeWidth="6" strokeLinecap="round" />

          {/* Central Blue 'W' */}
          <path d="M 80,88 L 92,148 L 100,108 L 108,148 L 120,88 L 108,88 L 103,126 L 97,98 L 93,98 L 87,126 L 82,88 Z" fill="#1D4ED8" />

          {/* Red Triangle with Map */}
          <polygon points="120,95 152,118 120,140" fill="#E63946" />
          <circle cx="134" cy="118" r="8" fill="#10B981" />
        </svg>
      )}
    </div>
  );
};
