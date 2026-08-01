import React from 'react';

export const Card = ({ children, className = '', title }) => {
  return (
    <div className={`glass rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-glow hover:border-primary/50 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-primary tracking-wide">{title}</h3>}
      {children}
    </div>
  );
};
