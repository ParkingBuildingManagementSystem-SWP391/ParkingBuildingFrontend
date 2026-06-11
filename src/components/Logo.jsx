import React from 'react';
import parkingLogo from '../assets/logo/parking-building-logo.png';

const Logo = ({ className = '', imageClassName = 'h-9', showText = true, textClassName = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={parkingLogo}
        alt="Parking Building Management System"
        className={`${imageClassName} w-auto object-contain shrink-0`}
      />
      {showText && (
        <span className={`font-bold tracking-wide ${textClassName}`}>
          Parking Building System
        </span>
      )}
    </div>
  );
};

export default Logo;
