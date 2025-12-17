import React, { useState, useEffect } from 'react';
import { RoomData, TeamData, RoomSummary } from '../types';
import { getTeamsData, getGameRegistry, clearActiveGameData, activateRoom } from '../services/storageService';
import { joinRoom, sendClientAction, disconnect } from '../services/networkService';
import { User, Users, LogIn, Wifi, Loader2, Activity, Globe, AlertCircle, KeyRound, MonitorX, ArrowLeft, History } from 'lucide-react';

interface Props {
  room: RoomData | null;
  onJoin: (name: string, teamId: number) => void;
  onBack: () => void;
}

const UserJoin: React.FC<Props> = ({ room, onJoin, onBack }) => {
  // --- STATE ---
  const [step, setStep] = useState<'LIST' | 'PROFILE'>('LIST'); 
  const [showManualInput, setShowManualInput] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [recentRooms, setRecentRooms] = useState<RoomSummary[]>([]);

  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Record<number, TeamData>>({});
  
  // --- EFFECTS ---

  useEffect(() => {
    // Load local registry
    const registry = getGameRegistry();
    setRecentRooms(registry);

    // UX Improvement: If no local rooms (e.g., new mobile device), default to Manual Input
    if (registry.length === 0) {
        setShowManualInput(true);
    }

    // Check URL for room code (Direct Link support)
    const params = new URLSearchParams(window.location.search);
    const urlRoomCode = params.get('room');
    if (urlRoomCode && !room && !isConnecting && step === 'LIST') {
        setShowManualInput(true); // Switch to manual view to show what's happening
        setRoomCodeInput(urlRoomCode);
        handleConnect(urlRoomCode);
    }
  }, []);

  // Listen for team data updates (to see which teams are full/occupied)
  useEffect(() => {
      const handleStorageChange = () => {
          if (room) {
              setTeams(getTeamsData());
          }
      };
      window.addEventListener('storage', handleStorageChange);
      const interval = setInterval(handleStorageChange, 1000);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
  }, [room]);

  // --- HANDLERS ---

  const handleConnect = (codeOverride?: string) => {
      const codeToUse = (codeOverride || roomCodeInput || '').trim().toUpperCase();
      if (!codeToUse || codeToUse.length < 6) return;

      setIsConnecting(true);
      setConnectError('');
      
      // Strategy: 
      // 1. Check if room exists in local registry (Same Device / Offline Mode)
      const localRoom = recentRooms.find(r => r.roomCode === codeToUse);

      if (localRoom) {
          // Use local data immediately
          activateRoom(codeToUse);
          
          // Small delay to ensure data loading and UI transition
          setTimeout(() => {
            setIsConnecting(false);
            setTeams(getTeamsData());
            setStep('PROFILE');
            
            // Attempt network connection in background (silent) for potential remote sync
            joinRoom(codeToUse, () => {}, () => {});
          }, 100);
          return;
      }

      // 2. If not local, try Remote Connect via PeerJS
      joinRoom(
          codeToUse, 
          () => {
              // Success
              setIsConnecting(false);
              setTeams(getTeamsData()); // Load initial team data
              setStep('PROFILE');
          },
          () => {
              // Fail
              setIsConnecting(false);
              setConnectError('작전 신호를 찾을 수 없습니다. 코드를 확인하세요.');
          }
      );
  };

  const handleJoinGame = () => {
    if (name && selectedTeam) {
      // Send join request to host
      sendClientAction('JOIN_REQUEST', { teamId: selectedTeam, name });
      // Notify parent app to switch to Waiting Room
      onJoin(name, selectedTeam);
    }
  };

  const handleBackToConnect = () => {
      disconnect();
      clearActiveGameData();
      setStep('LIST');
      setSelectedTeam(null);
      setConnectError('');
      // Don't reset name so user doesn't have to type it again if they misclicked
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-imf-black p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Bg Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black z-0"></div>
      
      {/* Back Button (Top Left) */}
      <button 
        onClick={onBack} 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> 메인으로
      </button>

      <div className="w-full max-w-lg space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3 tracking-tighter">
                <Globe className="text-imf-cyan w-8 h-8 animate-pulse" />
                IMF AGENT ACCESS
            </h1>
            <p className="text-imf-cyan/60 font-mono text-xs tracking-[0.3em] mt-2">SECURE UPLINK ESTABLISHED</p>
        </div>

        {/* STEP 1: SELECT OPERATION (ROOM LIST) */}
        {step === 'LIST' && (
            <div className="bg-imf-dark/80 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 min-h-[400px] flex flex-col">
                
                {/* Manual Input Toggle Header */}
                <div className="flex justify-between items-center mb-6">
                    <label className="flex items-center gap-2 text-white font-bold">
                        <Activity size={18} className="text-imf-red animate-pulse" /> 
                        {showManualInput ? "작전 코드 수동 입력" : "최근 접속 기록 (History)"}
                    </label>
                    <button 
                        onClick={() => setShowManualInput(!showManualInput)}
                        className="text-xs text-imf-cyan hover:underline flex items-center gap-1"
                    >
                        {showManualInput ? <><History size={12} /> 최근 기록 보기</> : <><KeyRound size={12} /> 코드 직접 입력</>}
                    </button>
                </div>

                {showManualInput ? (
                    // Manual Input View
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="mb-4">
                            <input 
                                type="text" 
                                value={roomCodeInput}
                                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                                placeholder="작전 코드 (6자리)"
                                className="w-full bg-black border border-gray-700 text-white p-4 rounded-lg font-mono text-center text-2xl tracking-widest focus:border-imf-cyan outline-none uppercase placeholder:text-gray-800 placeholder:text-lg"
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                        <button 
                            onClick={() => handleConnect()}
                            disabled={isConnecting || roomCodeInput.length < 6}
                            className="w-full bg-imf-cyan hover:bg-cyan-400 text-black font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isConnecting ? <Loader2 className="animate-spin" /> : "접속 승인 요청"}
                        </button>
                        
                        {connectError && (
                            <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-950/30 p-3 rounded border border-red-900/50 justify-center">
                                <AlertCircle size={16} /> {connectError}
                            </div>
                        )}
                        
                        <p className="mt-6 text-xs text-gray-500 text-center">
                            * 관리자 화면(PC)에 표시된 6자리 코드를 입력하거나<br/>QR 코드를 스캔하세요.
                        </p>
                    </div>
                ) : (
                    // Room List View
                    <div className="flex-1 flex flex-col">
                        {recentRooms.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-lg p-8 bg-black/20">
                                <MonitorX size={48} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-bold text-gray-500 mb-2">접속 기록 없음</h3>
                                <p className="text-xs text-center max-w-[200px]">
                                    새로운 작전에 참여하려면<br/>[코드 직접 입력]을 이용하세요.
                                </p>
                                <button 
                                    onClick={() => setShowManualInput(true)}
                                    className="mt-6 text-imf-cyan text-sm hover:underline"
                                >
                                    코드로 입장하기
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-1">
                                {recentRooms.map((r) => (
                                    <button
                                        key={r.roomCode}
                                        onClick={() => handleConnect(r.roomCode)}
                                        className="w-full relative group bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-imf-cyan p-5 rounded-lg flex justify-between items-center transition-all text-left overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-700 group-hover:bg-imf-cyan transition-colors"></div>
                                        
                                        <div className="pl-2">
                                            <div className="font-bold text-white text-lg group-hover:text-imf-cyan transition-colors flex items-center gap-2">
                                                {r.orgName}
                                                {r.isEnded && <span className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded">종료됨</span>}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs font-mono text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Activity size={10} /> 
                                                    {new Date(r.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="bg-black px-2 py-0.5 rounded text-gray-400 border border-gray-800 group-hover:border-imf-cyan/30">
                                                    CODE: {r.roomCode}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center group-hover:bg-imf-cyan group-hover:text-black transition-colors border border-gray-700 group-hover:border-imf-cyan shadow-lg">
                                            {isConnecting ? <Loader2 className="animate-spin" size={20} /> : <Wifi size={20} />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {isConnecting && !showManualInput && (
                             <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                 <div className="bg-imf-dark border border-imf-cyan p-6 rounded-lg shadow-2xl flex flex-col items-center">
                                     <Loader2 className="animate-spin text-imf-cyan w-10 h-10 mb-4" />
                                     <p className="text-white font-bold">보안 채널 연결 중...</p>
                                     <p className="text-xs text-imf-cyan font-mono mt-1">ESTABLISHING SECURE UPLINK</p>
                                 </div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* STEP 2: PROFILE & TEAM (Only shown after successful connection) */}
        {step === 'PROFILE' && room && (
            <div className="bg-imf-dark/80 backdrop-blur-md border border-imf-cyan/30 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-right-4">
                 
                 {/* Connection Status Header */}
                 <div className="flex items-center justify-between mb-6 bg-imf-cyan/5 p-3 rounded border border-imf-cyan/20">
                     <div>
                         <div className="text-[10px] text-imf-cyan font-mono tracking-wider">CONNECTED TO OPERATION</div>
                         <div className="text-white font-bold text-lg">{room.orgName}</div>
                     </div>
                     <button onClick={handleBackToConnect} className="text-xs text-red-400 hover:text-red-300 underline">
                         연결 끊기
                     </button>
                 </div>

                 <div className="space-y-6">
                     {/* Name Input */}
                     <div>
                        <label className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-2">
                           <User size={16} /> 요원명 입력 (Agent ID)
                        </label>
                        <input 
                           type="text" 
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                           className="w-full bg-black border border-gray-700 text-white p-4 rounded focus:border-imf-cyan outline-none font-bold text-lg placeholder:font-normal placeholder:text-gray-700 transition-colors"
                           placeholder="본인의 이름을 입력하세요"
                        />
                     </div>

                     {/* Team Grid */}
                     <div>
                        <label className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-2">
                            <Users size={16} /> 소속 팀 선택 (Team Assignment)
                        </label>
                        <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                            {Array.from({ length: room.totalTeams }, (_, i) => i + 1).map((id) => {
                                const teamData = teams[id];
                                const count = teamData?.members?.length || 0;
                                const isSelected = selectedTeam === id;
                                
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedTeam(id)}
                                        className={`
                                            relative h-14 rounded-lg border flex flex-col items-center justify-center transition-all
                                            ${isSelected 
                                                ? 'bg-imf-cyan text-black border-imf-cyan shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105 z-10' 
                                                : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:bg-gray-800'}
                                        `}
                                    >
                                        <span className="font-bold text-sm">{id}조</span>
                                        <span className={`text-[10px] ${isSelected ? 'text-black/70' : 'text-gray-600'}`}>
                                            {count}명 대기
                                        </span>
                                        {count > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                     </div>

                     {/* Submit Button */}
                     <button 
                         onClick={handleJoinGame}
                         disabled={!name || !selectedTeam}
                         className="w-full bg-gradient-to-r from-imf-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-lg uppercase tracking-widest shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                     >
                         <LogIn size={20} /> 작전 대기실 입장
                     </button>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserJoin;