
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// HariumAiLoader Component: A larger, scaled-up version for desktop displays.
export const HariumAiLoader = () => {
  return (
    <>
      {/* The animations are scaled up. The 'wave' moves further and the 'pulsate' has a wider glow. */}
      <style>
        {`
          @keyframes wave {
            0%, 60%, 100% {
              transform: initial;
            }
            30% {
              transform: translateY(-30px); /* Increased travel distance */
            }
          }
          .animate-wave-bar {
            animation: wave 1.3s ease-in-out infinite;
          }
          
          @keyframes pulsate {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.07);
            }
            50% {
              box-shadow: 0 0 0 50px rgba(0, 0, 0, 0); /* Increased glow radius */
            }
          }
          .animate-pulsate {
            animation: pulsate 2s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* The padding on the outer container is increased for the larger glow effect. */}
      <div className="flex items-center justify-center p-12 rounded-full animate-pulsate">
        <div className="flex flex-col items-center justify-center space-y-6"> {/* Increased vertical spacing */}
          <div className="flex items-end justify-center space-x-3 h-20"> {/* Increased horizontal spacing and height */}
            {/* The bars are now taller and wider. */}
            <div
              className="w-3 h-10 bg-black rounded-full animate-wave-bar"
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div
              className="w-3 h-10 bg-black rounded-full animate-wave-bar"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-3 h-10 bg-black rounded-full animate-wave-bar"
              style={{ animationDelay: '0.3s' }}
            ></div>
            <div
              className="w-3 h-10 bg-black rounded-full animate-wave-bar"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
          
          {/* The text is significantly larger and maintains the requested formatting. */}
          <p className="text-black font-black tracking-widest text-xl">
            <span className="text-2xl">H</span>
            <span className="text-lg">arium</span>
            <span className="text-2xl"> AI</span>
          </p>
        </div>
      </div>
    </>
  );
};

// Main App Component: This component centers and displays the loader.
export default function FullscreenLoader({ isUnlocking }: { isUnlocking?: boolean }) {
  return (
    <div className={cn(
        "flex items-center justify-center w-screen h-screen bg-white font-sans transition-opacity duration-500",
        isUnlocking ? "animate-loader-fade-out" : "opacity-100"
    )}>
      <HariumAiLoader />
    </div>
  );
}

