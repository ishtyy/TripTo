import React from 'react';

export default function TextLogo() {
  return (
    // We add the "text-logo-container" class here for the CSS above to target.
    <div className="text-logo-container">
      <div className="flex items-center justify-center cursor-pointer h-10" aria-label="TripTo Homepage">
        <div className="relative flex items-end">
          <span className="text-3xl font-bold animated-gradient-text">Tr</span>
          
          <div className="relative">
            <span className="text-3xl font-bold animated-gradient-text" style={{ paddingRight: '1px' }}>i</span>
            <svg className="w-4 h-4 text-cyan-400 absolute -top-0 right-[-3px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>

          <span className="text-3xl font-bold animated-gradient-text">pTo</span>
        </div>
      </div>
    </div>
  );
}