import React, { useState, useEffect } from 'react';

interface CrevaWebzLoaderProps {
  isAppReady?: boolean;
  onFadeOutComplete?: () => void;
}

const LOADING_MESSAGES = [
  'Preparing your store...',
  'Setting up your experience...',
  'Loading your store...',
  'Almost ready...',
  'Welcome to CrevaWebz'
];

export default function CrevaWebzLoader({
  isAppReady = false,
  onFadeOutComplete
}: CrevaWebzLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  // Cycle through dynamic loading messages
  useEffect(() => {
    if (isAppReady) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAppReady]);

  // Sequential loading dots animation (• -> •• -> ••• -> repeat)
  useEffect(() => {
    if (isAppReady) return;
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '•••') return '';
        return prev + '•';
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isAppReady]);

  // Handle completion fade-out logic
  useEffect(() => {
    if (isAppReady) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        if (onFadeOutComplete) {
          onFadeOutComplete();
        }
      }, 800); // Wait for the transition to complete
      return () => clearTimeout(timer);
    }
  }, [isAppReady, onFadeOutComplete]);

  const brandLetters = [
    { char: 'C', color: 'text-[#3C77C3]' },
    { char: 'R', color: 'text-[#3C77C3]' },
    { char: 'E', color: 'text-[#3C77C3]' },
    { char: 'V', color: 'text-[#3C77C3]' },
    { char: 'A', color: 'text-[#3C77C3]' },
    { char: ' ', color: '' },
    { char: 'W', color: 'text-white' },
    { char: 'E', color: 'text-white' },
    { char: 'B', color: 'text-white' },
    { char: 'Z', color: 'text-white' }
  ];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070A13] transition-all duration-700 ease-in-out select-none ${
        isExiting ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,119,195,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Logo & Sweep Wrapper */}
      <div className="relative flex flex-col items-center justify-center space-y-8 animate-[fadeInScale_1.2s_ease-out-back_forwards]">
        
        {/* Isolated Symbol Container via precise aspect-ratio cropping */}
        <div className="relative w-64 h-[110px] overflow-hidden rounded-xl">
          {/* Main Logo Symbol */}
          <img
            src="/logo-crevawebz.png"
            alt="CrevaWebz Logo"
            className="absolute top-0 left-0 w-full h-auto object-cover object-top filter drop-shadow-[0_0_20px_rgba(60,119,195,0.35)]"
          />

          {/* Premium moving light sweep effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3C77C3]/15 to-transparent -translate-x-full animate-[shimmerSweep_3s_infinite_ease-in-out]" />
        </div>

        {/* Letter-by-letter brand name reveal */}
        <div className="flex items-center justify-center tracking-[0.25em] text-lg font-black uppercase pl-[0.25em]">
          {brandLetters.map((item, idx) => (
            <span
              key={idx}
              className={`inline-block transform opacity-0 translate-y-3 ${item.color} ${item.char === ' ' ? 'w-4' : ''}`}
              style={{
                animation: 'fadeUpLetter 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
                animationDelay: `${0.3 + idx * 0.05}s`
              }}
            >
              {item.char}
            </span>
          ))}
        </div>
      </div>

      {/* Loading Status & Animated Dots */}
      <div className="absolute bottom-16 flex flex-col items-center space-y-2.5 min-h-[44px]">
        {/* Dynamic dynamic loading messages */}
        <div className="relative overflow-hidden w-64 h-5 flex items-center justify-center">
          {LOADING_MESSAGES.map((msg, idx) => (
            <span
              key={idx}
              className={`absolute text-[11px] font-bold tracking-widest text-slate-400 uppercase transition-all duration-500 ease-in-out transform ${
                msgIndex === idx
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              {msg}
            </span>
          ))}
        </div>

        {/* Dots sequence (• -> •• -> •••) */}
        <div className="h-2 flex items-center justify-center">
          <span className="text-[10px] tracking-widest text-[#3C77C3] font-bold font-mono">
            {dots || '\u00A0'}
          </span>
        </div>
      </div>

      {/* Embed CSS keyframe styles inside style tag to avoid CSS file creation issues */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeUpLetter {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmerSweep {
          0% {
            transform: translateX(-120%) skewX(-15deg);
          }
          40% {
            transform: translateX(120%) skewX(-15deg);
          }
          100% {
            transform: translateX(120%) skewX(-15deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[shimmerSweep_3s_infinite_ease-in-out\\] {
            animation: none !important;
          }
          .animate-\\[fadeInScale_1.2s_ease-out-back_forwards\\] {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          span[style*="animation"] {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      ` }} />
    </div>
  );
}
