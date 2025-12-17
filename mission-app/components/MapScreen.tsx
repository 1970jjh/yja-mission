import React from 'react';
import { LocationId, PuzzleData } from '../types';
import { PUZZLES } from '../constants';
import { MapPin, Lock, CheckCircle, Crosshair } from 'lucide-react';

interface Props {
  unlockedLocations: LocationId[];
  completedLocations: LocationId[];
  onSelectLocation: (id: LocationId) => void;
}

const MapScreen: React.FC<Props> = ({ unlockedLocations, completedLocations, onSelectLocation }) => {
  const locations = Object.values(PUZZLES);

  return (
    <div className="flex flex-col min-h-screen bg-imf-black text-gray-300 font-sans">
      <header className="p-4 border-b border-imf-gray flex justify-between items-center bg-imf-dark/90 sticky top-0 z-20 backdrop-blur-md">
        <h2 className="text-xl text-imf-cyan font-bold tracking-widest flex items-center gap-2">
            <GlobeIcon /> 전 세계 추적 현황
        </h2>
        <div className="flex items-center gap-2 font-mono">
           <span className="w-2 h-2 bg-imf-red rounded-full animate-pulse"></span>
           <span className="text-xs">SATELLITE ONLINE</span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 relative">
         {/* Decorative Map Background */}
         <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] bg-center bg-cover mix-blend-overlay"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 max-w-7xl mx-auto">
          {locations.map((loc) => {
            const isUnlocked = unlockedLocations.includes(loc.id);
            const isCompleted = completedLocations.includes(loc.id);
            const isNext = isUnlocked && !isCompleted;

            return (
              <div 
                key={loc.id}
                onClick={() => isUnlocked ? onSelectLocation(loc.id) : null}
                className={`
                  relative border-2 transition-all duration-300 cursor-pointer overflow-hidden rounded-lg group h-64 flex flex-col
                  ${isCompleted ? 'border-imf-cyan/50' : ''}
                  ${isNext ? 'border-imf-red shadow-[0_0_20px_rgba(255,0,60,0.3)] scale-[1.02]' : ''}
                  ${!isUnlocked ? 'border-imf-gray opacity-60 grayscale cursor-not-allowed' : ''}
                `}
              >
                {/* Background Image for Card */}
                {isUnlocked && loc.backgroundImage && (
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${loc.backgroundImage})` }}></div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${isNext ? 'from-imf-red/90 to-transparent' : 'from-black/90 via-black/40 to-black/20'}`}></div>

                {/* Status Indicator */}
                <div className="absolute top-3 left-3 z-10">
                    <div className={`p-2 rounded-full backdrop-blur-sm ${isNext ? 'bg-imf-red/20 text-imf-red border border-imf-red' : isCompleted ? 'bg-imf-cyan/20 text-imf-cyan border border-imf-cyan' : 'bg-gray-900/50 text-gray-500 border border-gray-700'}`}>
                        {isCompleted ? <CheckCircle size={20} /> : isUnlocked ? <Crosshair size={20} className={isNext ? "animate-spin-slow" : ""} /> : <Lock size={20} />}
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 mt-auto p-5">
                    {loc.isBomb && isUnlocked && !isCompleted && (
                        <div className="mb-2">
                             <span className="text-[10px] bg-imf-red text-white px-2 py-1 font-bold animate-pulse rounded uppercase tracking-wider">
                            핵 위협 감지
                            </span>
                        </div>
                    )}
                    
                    <h3 className={`text-xl font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-400'} drop-shadow-md`}>
                    {isUnlocked ? loc.title : '위치 추적 중...'}
                    </h3>
                    
                    <p className="text-xs text-imf-cyan mb-2 font-mono opacity-90">
                    {isUnlocked ? loc.coordinates : 'ENCRYPTED COORDINATES'}
                    </p>

                    <div className="text-xs text-gray-300 font-medium">
                    {isUnlocked 
                        ? (isCompleted ? "미션 완료" : "작전 수행 필요") 
                        : "이전 미션 완수 대기 중"}
                    </div>
                </div>
                
                {/* Scan Line Animation */}
                {isNext && (
                   <div className="absolute top-0 left-0 w-full h-1 bg-imf-red shadow-[0_0_10px_#ff003c] animate-[scan_2.5s_linear_infinite]"></div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

export default MapScreen;