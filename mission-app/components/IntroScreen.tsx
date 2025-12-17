import React, { useState, useEffect } from 'react';
import { INTRO_TEXT } from '../constants';
import { ShieldAlert, Globe, Radio } from 'lucide-react';
import { ParticleNetwork, DecipherText, GlitchText } from './VisualEffects';

interface Props {
  onStart: () => void;
}

const IntroScreen: React.FC<Props> = ({ onStart }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showButton, setShowButton] = useState(false);

  // Typewriter effect logic
  useEffect(() => {
    let i = 0;
    const speed = 25; 
    const timer = setInterval(() => {
      if (i < INTRO_TEXT.length) {
        setDisplayedText((prev) => prev + INTRO_TEXT.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setShowButton(true);
      }
    }, speed);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6 relative overflow-hidden">
      
      {/* Dynamic Backgrounds */}
      <ParticleNetwork />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"></div>

      <div className="z-10 w-full max-w-2xl border border-imf-gray/50 bg-black/80 backdrop-blur-md p-8 shadow-[0_0_20px_rgba(0,240,255,0.15)] rounded-sm relative">
        {/* Corner Decors */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-imf-cyan"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-imf-cyan"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-imf-cyan"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-imf-cyan"></div>

        <div className="flex items-center justify-between mb-6 border-b border-imf-gray/50 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-imf-red animate-pulse" />
            <GlitchText text="IMF SECURE LINK" className="text-xl font-bold tracking-widest text-white font-sans" />
          </div>
          <div className="flex items-center gap-2 text-xs text-imf-red font-mono">
            <Radio className="w-4 h-4 animate-pulse" />
            LIVE FEED
          </div>
        </div>

        <div className="min-h-[250px] mb-8 whitespace-pre-line leading-loose text-gray-200 text-sm md:text-base font-mono">
          <DecipherText text={displayedText} speed={0} reveal={false} />
          {/* We rely on the raw displayedText state for the typewriter feel, 
              but we could use DecipherText for static blocks. 
              Here we just use simple text rendering for the typewriter. 
          */}
          {displayedText}
          <span className="animate-pulse inline-block w-2 h-4 bg-imf-cyan ml-1 align-middle"></span>
        </div>

        {showButton && (
          <button
            onClick={onStart}
            className="w-full group relative py-4 px-6 bg-imf-cyan/10 border border-imf-cyan hover:bg-imf-cyan hover:text-black transition-all duration-300 uppercase tracking-[0.2em] font-bold text-imf-cyan"
          >
            <div className="absolute inset-0 w-full h-full border border-imf-cyan opacity-50 blur-[2px] group-hover:blur-md transition-all"></div>
            <span className="relative flex items-center justify-center gap-2 font-sans">
              <Globe className="w-5 h-5" />
              미션 승인 (Mission Accept)
            </span>
          </button>
        )}
      </div>
      
      <div className="absolute bottom-4 text-imf-gray text-xs font-mono z-10 flex gap-4">
        <span>ENCRYPTION: AES-256</span>
        <span>//</span>
        <span>PROTOCOL: GHOST</span>
      </div>
    </div>
  );
};

export default IntroScreen;