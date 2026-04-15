import React, { useState } from 'react';
import { ShaderAnimation } from './ui/shader-animation';

const LandingPage = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleLaunch = () => {
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 500);
  };

  return (
    <div className={`fixed inset-0 w-full h-full z-[100] bg-black overflow-hidden flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${isExiting ? 'opacity-0 scale-[1.02]' : 'opacity-100'}`}>
      {/* Shader Background */}
      <div className="absolute inset-0 w-full h-full z-0 animate-fade-in" style={{ animationDuration: '800ms' }}>
        <ShaderAnimation />
      </div>
      
      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center text-center pointer-events-none px-6">
        <h1 id="landing-title" className="text-[48px] md:text-[72px] font-bold tracking-tighter whitespace-pre-wrap text-white font-headline animate-slide-up" style={{ animationDelay: '400ms' }}>
          ChainQuery
        </h1>
        
        <p className="text-[16px] md:text-[20px] font-normal text-white/80 tracking-[0.02em] mt-3 animate-slide-up" style={{ animationDelay: '600ms' }}>
          Supply Chain <span id="landing-subtitle">Intelligence</span> Platform
        </p>
        
        <div className="w-16 h-[1px] bg-white/30 my-8 animate-scale-x" style={{ animationDelay: '800ms' }} />
        
        <div className="flex flex-wrap justify-center gap-3">
          {['In-Browser SQL Engine', 'ML Forecasting Models', 'Executive Dashboards'].map((pill, i) => (
            <span 
              key={pill} 
              className="px-4 py-2 border border-white/20 rounded-full bg-transparent text-[13px] font-normal text-white/70 animate-fade-in"
              style={{ animationDelay: `${1000 + i * 100}ms` }}
            >
              {pill}
            </span>
          ))}
        </div>
        
        <button 
          onClick={handleLaunch}
          className="mt-12 px-10 py-3.5 bg-white/10 hover:bg-white/[0.18] border border-white/20 hover:border-white/35 rounded-lg text-[15px] font-medium text-white transition-all duration-200 pointer-events-auto hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
          style={{ animationDelay: '1300ms' }}
        >
          Launch Platform
        </button>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center text-[12px] text-white/40 font-normal pointer-events-none animate-fade-in" style={{ animationDelay: '1500ms' }}>
        Made by Mohammed Kaif Ahmed
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-x {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-fade-in { animation: fade-in 800ms ease-out forwards; opacity: 0; }
        .animate-slide-up { animation: slide-up 600ms ease-out forwards; opacity: 0; }
        .animate-scale-x { animation: scale-x 400ms ease-out forwards; transform-origin: center; }
      `}</style>
    </div>
  );
};

export default LandingPage;
