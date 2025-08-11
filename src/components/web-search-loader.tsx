
"use client";

import React, { useState, useEffect } from 'react';

// SVG Icon for the Globe
const GlobeIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`w-24 h-24 transition-colors duration-500 ${isActive ? 'text-black' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m0 0a9 9 0 019-9m-9 9a9 9 0 009 9"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 2a15.3 15.3 0 014.37 1.63m-8.74 0A15.3 15.3 0 0112 2zM2.63 7.63A15.3 15.3 0 012 12m1.63 4.37A15.3 15.3 0 012 12m8.74 8.37A15.3 15.3 0 0112 22m4.37-1.63A15.3 15.3 0 0112 22m-8.74 0A15.3 15.3 0 0112 22m-4.37-1.63A15.3 15.3 0 0112 22M21.37 16.37A15.3 15.3 0 0122 12m-1.63-4.37A15.3 15.3 0 0122 12"></path>
  </svg>
);


// The final, authentic loader component
export const WebSearchEnablingLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [statusText, setStatusText] = useState("Enabling...");
  const [stage, setStage] = useState('connecting'); // connecting -> securing -> complete
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setStatusText("Securing Connection...");
        setStage('securing');
      }, 2500),
      setTimeout(() => {
        setStatusText("Web Search Enabled");
        setStage('complete');
      }, 5000),
      setTimeout(() => {
        setIsFadingOut(true);
      }, 6500),
      setTimeout(() => {
        onComplete();
      }, 8000)
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <>
      <style>
        {`
          .container-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .particle {
            position: absolute; width: 3px; height: 3px; background-color: black; border-radius: 50%;
            animation: flow-to-center 2.5s ease-in-out forwards; opacity: 0;
          }
          @keyframes flow-to-center {
            0% { transform: translate(var(--x-start), var(--y-start)) scale(1); opacity: 1; }
            99% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(0, 0) scale(0); opacity: 0; }
          }
          .globe-pulse { animation: pulse-effect 2.5s ease-out infinite; animation-delay: 0.5s; }
          @keyframes pulse-effect { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
          .container-fade-out { animation: fade-out 1.5s ease-in forwards; }
          @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
          .scanner {
            position: absolute; width: 150%; height: 2px;
            background: linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent);
            top: 50%; left: -25%; animation: scan-effect 2.5s linear forwards; transform: translateY(-50%);
          }
          @keyframes scan-effect { 0% { top: -20%; } 100% { top: 120%; } }
          .shockwave {
            position: absolute; border-radius: 50%; border: 3px solid rgba(0,0,0,0.5);
            animation: shockwave-effect 1s ease-out forwards;
          }
          @keyframes shockwave-effect { 0% { width: 100%; height: 100%; opacity: 1; } 100% { width: 200%; height: 200%; opacity: 0; } }
          .typing-effect {
            display: inline-block; overflow: hidden; white-space: nowrap; border-right: 2px solid black;
            animation: typing 1s steps(30, end), blink-caret .75s step-end infinite;
          }
          @keyframes typing { from { width: 0 } to { width: 100% } }
          @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: black; } }
        `}
      </style>
      
      <div className={`flex flex-col items-center justify-center container-fade-in ${isFadingOut ? 'container-fade-out' : ''}`}>
        <div className="relative w-48 h-48 flex items-center justify-center" style={{
          background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.03) 65%, transparent 65%), radial-gradient(circle, transparent 80%, rgba(0,0,0,0.03) 80%, rgba(0,0,0,0.03) 85%, transparent 85%)'
        }}>
          <div className={`transition-all duration-1000 ${stage === 'securing' || stage === 'complete' ? 'opacity-100' : 'opacity-0'} ${stage === 'complete' ? 'globe-pulse' : ''}`}>
             <GlobeIcon isActive={stage === 'complete'} />
          </div>
          {stage === 'connecting' && Array.from({ length: 30 }).map((_, i) => {
            const angle = Math.random() * 360;
            const radius = 150 + Math.random() * 50;
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            return (
              <div key={i} className="particle" style={{'--x-start': `${x}px`, '--y-start': `${y}px`, animationDelay: `${Math.random() * 1}s`}}></div>
            );
          })}
          {stage === 'securing' && <div className="scanner"></div>}
          {stage === 'complete' && <div className="shockwave"></div>}
        </div>
        <div className="text-black font-bold text-xl mt-4 h-8 transition-opacity duration-300">
           <p key={statusText} className="typing-effect">{statusText}</p>
        </div>
      </div>
    </>
  );
};
