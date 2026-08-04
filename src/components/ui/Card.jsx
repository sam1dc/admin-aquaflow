import React from 'react';

export const Card = ({ children, className = '', title }) => {
  return (
    <div className={`glass-card rounded-xl p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-primary tracking-wide">{title}</h3>}
      {children}
    </div>
  );
};
