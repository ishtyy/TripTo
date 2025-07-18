import React from 'react';

export default function AdminTextLogo() {
  return (
    <div className="flex items-center justify-center cursor-pointer h-10" aria-label="TripTo Admin Panel">
      <svg width="125" height="40" viewBox="0 0 125 40">
        <defs>
          <linearGradient id="adminLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
        
        {/* The entire logo is a single SVG group, making it one unified object */}
        <g style={{ fill: "url(#adminLogoGradient)" }}>
          <text x="0" y="32" fontFamily="Poppins, sans-serif" fontSize="32" fontWeight="800">
            TripTo
          </text>
          {/* The map pin is now part of the SVG, perfectly positioned */}
          <path
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            transform="translate(42, -5) scale(0.7)"
          />
        </g>
      </svg>
    </div>
  );
}