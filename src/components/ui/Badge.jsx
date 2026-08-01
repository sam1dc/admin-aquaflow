import React from 'react';

export const Badge = ({ children, variant = 'info' }) => {
  const variantClasses = {
    info: 'bg-primary/10 text-primary border-primary/30',
    success: 'bg-status-success/10 text-status-success border-status-success/30',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/30',
    error: 'bg-status-error/10 text-status-error border-status-error/30',
    primary: 'bg-primary/10 text-primary border-primary/30',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variantClasses[variant] || variantClasses.info}`}>
      {children}
    </span>
  );
};
