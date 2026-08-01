import React from 'react';

export const LogoIcon = ({ size = 36, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
  >
    {/* Droplet Body tilted to top-left (-22 deg) */}
    <path 
      d="M50 6C50 6 16 42 16 64C16 82.7777 31.2223 98 50 98C68.7777 98 84 82.7777 84 64C84 42 50 6 50 6Z" 
      fill="#70C5FF"
      transform="rotate(-22 50 52)"
    />
    {/* Inner dark accent arc line at the bottom */}
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
  const iconSize = size === "lg" ? 44 : size === "sm" ? 28 : 34;
  const textSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={iconSize} />
      <div className="flex items-center gap-2">
        <span className={`${textSize} font-bold text-[#70C5FF] tracking-tight`}>
          AquaFlow
        </span>
        {showAdmin && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
            Admin
          </span>
        )}
      </div>
    </div>
  );
};
