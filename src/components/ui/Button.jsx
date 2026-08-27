import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-base',
    };

    const variantClasses = {
        primary: 'bg-primary-container text-white shadow-md hover:shadow-glow hover:scale-[1.02] focus:ring-primary/50 active:scale-[0.97]',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50 active:scale-[0.97]',
        secondary: 'bg-slate-800 text-slate-300 hover:bg-slate-700 focus:ring-slate-500/50 active:scale-[0.97]',
        outline: 'bg-transparent text-text-main border border-outline-variant hover:bg-white/5 hover:border-primary/50 focus:ring-primary/30',
        success: 'bg-status-success text-surface-container-lowest hover:bg-status-success/80 hover:shadow-[0_0_15px_rgba(46,204,113,0.3)] focus:ring-status-success/50 active:scale-[0.97]',
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