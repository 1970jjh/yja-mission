import React from 'react';
import { Award, RefreshCcw, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { LocationId } from '../types';
import { PUZZLES } from '../constants';

interface Props {
  gameStartTime: number;
  completionTimes: Record<string, number>;
  hintCount: number;
  finishTime: number;
}

const SuccessScreen: React.FC<Props> = ({ gameStartTime, completionTimes, hintCount, finishTime }) => {
  // Use fixed finishTime for calculation so it doesn't tick
  const baseDuration = finishTime - gameStartTime;
  
  // Penalty: 5 minutes per hint
  const penaltyMs = hintCount * 5 * 60 * 1000;
  const totalDuration = baseDuration + penaltyMs;

  const formatDuration = (ms: number) => {
    // Ensure no negative times
    if (ms < 0) ms = 0;
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}분 ${seconds}초`;
  };

  // Helper to calculate duration for specific stages
  const getStageDuration = (locationId: LocationId, prevCompletionTime: number) => {
    const completedAt = completionTimes[locationId];
    if (!completedAt) return 0;
    return completedAt - prevCompletionTime;
  };

  const stageOrder = [
    LocationId.BLUE_HOUSE,
    LocationId.SAN_FRANCISCO,
    LocationId.FRANCE,
    LocationId.INCHEON_AIRPORT
  ];

  let previousTime = gameStartTime;

  return (
    <div className="min-h-screen bg-imf-black flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay animate-pulse"></div>
      
      <div className="z-10 max-w-2xl w-full border-2 border-imf-cyan p-8 bg-imf-dark/95 shadow-[0_0_50px_rgba(0,240,255,0.2)] rounded-lg backdrop-blur-md max-h-[90vh] overflow-y-auto">
        <Award className="w-20 h-20 text-imf-cyan mx-auto mb-6" />
        
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tighter">
          미션 성공을 축하합니다!!!
        </h1>
        <p className="text-gray-400 mb-8 font-mono text-sm">MISSION ACCOMPLISHED</p>
        
        <div className="bg-black/50 rounded-lg p-6 mb-8 border border-gray-800">
           <div className="flex flex-col gap-4">
               {/* Time Breakdown */}
               <div className="flex justify-between items-center text-gray-400 text-sm border-b border-gray-800 pb-2">
                   <span>기본 수행 시간</span>
                   <span className="font-mono">{formatDuration(baseDuration)}</span>
               </div>
               <div className="flex justify-between items-center text-imf-red text-sm border-b border-gray-800 pb-2">
                   <div className="flex items-center gap-2">
                       <AlertTriangle size={14} />
                       <span>힌트 페널티 ({hintCount}회)</span>
                   </div>
                   <span className="font-mono">+ {formatDuration(penaltyMs)}</span>
               </div>
               
               {/* Total Time */}
               <div className="flex items-center justify-center gap-3 mt-2 text-imf-gold">
                  <Clock size={24} />
                  <span className="text-xl font-bold">최종 작전 기록</span>
               </div>
               <div className="text-4xl font-mono text-white font-bold tracking-widest text-shadow-glow">
                 {formatDuration(totalDuration)}
               </div>
           </div>
        </div>

        <div className="space-y-3 mb-8 text-left">
           <h3 className="text-imf-cyan font-bold text-sm uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">작전 보고서 (Mission Log)</h3>
           {stageOrder.map((locId) => {
             if (!completionTimes[locId]) return null;
             const duration = getStageDuration(locId, previousTime);
             previousTime = completionTimes[locId]; 
             
             return (
               <div key={locId} className="flex items-center justify-between p-3 bg-white/5 rounded hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <CheckCircle size={16} className="text-green-500" />
                     <span className="text-gray-300 font-bold">{PUZZLES[locId].title}</span>
                  </div>
                  <span className="font-mono text-imf-cyan">{formatDuration(duration)}</span>
               </div>
             );
           })}
        </div>

        <div className="text-imf-cyan text-sm font-bold tracking-[0.3em] animate-pulse bg-imf-cyan/10 py-2 rounded">
          PROTOCOL GHOST DEACTIVATED
        </div>
      </div>
      
      <button 
        onClick={() => window.location.reload()}
        className="mt-8 text-gray-500 hover:text-white flex items-center gap-2 text-sm z-10 transition-colors py-4"
      >
        <RefreshCcw size={16} />
        시뮬레이션 초기화 (Reset)
      </button>

      <style>{`
        .text-shadow-glow {
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default SuccessScreen;