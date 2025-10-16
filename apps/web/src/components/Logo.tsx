import React from "react";

export default function Logo({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <div className="logo flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-label="Clarus logo" role="img">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6EA8FF"/>
            <stop offset="100%" stopColor="#7AF0E3"/>
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="36" height="36" rx="10" fill="url(#g)"/>
        <path d="M31.5 18.5c-2.2-2.2-5.8-2.2-8 0l-7 7 3 3 7-7a3 3 0 1 1 4.2 4.2l-5.3 5.3 3 3 5.3-5.3c2.2-2.2 2.2-5.8 0-8z" fill="white"/>
      </svg>
      {wordmark && <span className="logo-text">Clarus</span>}
    </div>
  );
}