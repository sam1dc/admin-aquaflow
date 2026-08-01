import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary text-white shadow-md hover:bg-primary-dark hover:shadow-glow focus:ring-primary/50 active:scale-[0.97]',
    danger: 'bg-status-error text-white hover:bg-status-error/80 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] focus:ring-status-error/50 active:scale-[0.97]',
    outline: 'bg-transparent text-text-main border border-border hover:bg-white/5 hover:border-primary/50 focus:ring-primary/30',
    success: 'bg-status-success text-white hover:bg-status-success/80 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] focus:ring-status-success/50 active:scale-[0.97]',
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
