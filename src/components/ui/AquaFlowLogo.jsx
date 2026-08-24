import React from 'react';

// Se mantiene el LogoIcon original por compatibilidad o si se requiere un isotipo minimalista
export const LogoIcon = ({ size = 36, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
  >
    <path 
      d="M50 6C50 6 16 42 16 64C16 82.7777 31.2223 98 50 98C68.7777 98 84 82.7777 84 64C84 42 50 6 50 6Z" 
      fill="#70C5FF"
      transform="rotate(-22 50 52)"
    />
    <path 
      d="M 36 66 A 14 14 0 0 0 60 66" 
      stroke="#09121F" 
      strokeWidth="7.5" 
      strokeLinecap="round" 
      transform="rotate(-22 50 52)"
    />
  </svg>
);

export const AquaFlowLogo = ({ showAdmin = true, size = "md", className = "" }) => {
  const iconSize = size === "lg" ? "h-12" : size === "sm" ? "h-6" : "h-9";
  const textSize = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img 
        src="/logo.png" 
        alt="AquaFlow Icon" 
        className={`${iconSize} w-auto object-contain drop-shadow-md`} 
      />
      <div className="flex items-center gap-2 mt-1">
        <span className={`${textSize} font-black tracking-tight leading-none`}>
          <span className="text-white">AQUA</span>
          <span className="text-primary">FLOW</span>
        </span>
        {showAdmin && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
            Admin
          </span>
        )}
      </div>
    </div>
  );
};
