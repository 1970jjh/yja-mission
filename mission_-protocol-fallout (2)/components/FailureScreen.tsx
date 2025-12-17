import React from 'react';
import { Skull, RefreshCcw } from 'lucide-react';

const FailureScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1629633804868-8092496924b2?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-multiply"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-red-900/50"></div>
      
      {/* Glitch Effect Overlay */}
      <div className="absolute inset-0 z-0 animate-pulse bg-red-600/10 pointer-events-none"></div>

      <div className="z-10 max-w-2xl w-full border-4 border-red-600 p-8 bg-black/90 shadow-[0_0_100px_rgba(255,0,0,0.5)] rounded-lg backdrop-blur-md">
        <Skull className="w-24 h-24 text-red-600 mx-auto mb-6 animate-bounce" />
        
        <h1 className="text-4xl md:text-6xl font-black text-red-600 mb-4 tracking-tighter uppercase glitch-text">
          MISSION FAILED
        </h1>
        <p className="text-white text-xl md:text-2xl font-bold mb-8 font-mono">
          핵폭탄이 폭발했습니다.
        </p>
        
        <div className="bg-red-900/20 border border-red-600/30 p-6 rounded mb-8">
            <p className="text-red-400 font-mono text-sm leading-relaxed">
                [SYSTEM CRITICAL]<br/>
                DETONATION SEQUENCE COMPLETED.<br/>
                ALL SIGNALS LOST.<br/>
                ESTIMATED CASUALTIES: UNKNOWN.
            </p>
        </div>

        <button 
            onClick={() => window.location.reload()}
            className="group relative bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_40px_rgba(255,0,0,0.6)]"
        >
            <span className="flex items-center gap-2">
                <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                작전 재시도 (RETRY)
            </span>
        </button>
      </div>
      
      <style>{`
        .glitch-text {
          position: relative;
          animation: glitch 2s infinite;
        }
        @keyframes glitch {
          0% { text-shadow: 2px 2px 0px #ff0000, -2px -2px 0px #0000ff; }
          2% { text-shadow: -2px 2px 0px #ff0000, 2px -2px 0px #0000ff; }
          4% { text-shadow: none; }
          100% { text-shadow: none; }
        }
      `}</style>
    </div>
  );
};

export default FailureScreen;