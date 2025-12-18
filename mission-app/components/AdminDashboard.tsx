import React, { useState, useEffect } from 'react';
import { RoomData, TeamData, RoomSummary, LocationId } from '../types';
import { 
  saveRoomData, 
  getTeamsData, 
  clearActiveGameData, 
  getGameRegistry, 
  createNewRoom, 
  activateRoom, 
  deleteRoom,
  getRoomData
} from '../services/storageService';
import { initializeHost, broadcastState, disconnect } from '../services/networkService';
import { Users, Play, Trophy, Ban, Activity, Trash2, LogIn, PlusSquare, ArrowLeft, MonitorPlay, Bomb, ShieldCheck, Eye, EyeOff, Clock, QrCode, X } from 'lucide-react';
import BackgroundMusic from './BackgroundMusic';
import { AnimatedEarthBackground } from './VisualEffects';

interface Props {
  room: RoomData | null;
}

const TOTAL_STAGES = 4; // Blue House, SF, France, Incheon

const AdminDashboard: React.FC<Props> = ({ room: initialRoom }) => {
  // Mode: 'LOBBY' (Choosing room) or 'DASHBOARD' (Monitoring room)
  const [viewMode, setViewMode] = useState<'LOBBY' | 'DASHBOARD'>(initialRoom ? 'DASHBOARD' : 'LOBBY');
  
  // Lobby State
  const [roomList, setRoomList] = useState<RoomSummary[]>([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [newTeamCount, setNewTeamCount] = useState(2);
  const [newDurationMinutes, setNewDurationMinutes] = useState(60);
  const [isCreating, setIsCreating] = useState(false);

  // Dashboard State
  const [localRoom, setLocalRoom] = useState<RoomData | null>(initialRoom);
  const [teams, setTeams] = useState<Record<number, TeamData>>({});
  const [showResults, setShowResults] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // --- LOBBY EFFECTS ---
  useEffect(() => {
    if (viewMode === 'LOBBY') {
        setRoomList(getGameRegistry());
        disconnect(); // Disconnect previous sessions
    }
  }, [viewMode]);

  // --- DASHBOARD EFFECTS ---
  // Initialize Host if room exists and we are in Dashboard mode
  useEffect(() => {
    if (viewMode === 'DASHBOARD' && localRoom?.roomCode) {
      initializeHost(localRoom.roomCode);
      
      // Cleanup on unmount or mode switch
      return () => {
          disconnect();
      };
    }
  }, [viewMode, localRoom?.roomCode]);

  // Sync teams locally for dashboard
  useEffect(() => {
    if (viewMode !== 'DASHBOARD') return;

    const sync = () => {
      setTeams(getTeamsData());
      const currentRoom = getRoomData();
      if (currentRoom) setLocalRoom(currentRoom);
    };
    sync();
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, [viewMode]);

  // Timer countdown for dashboard
  useEffect(() => {
    if (viewMode !== 'DASHBOARD' || !localRoom?.isStarted || !localRoom?.startTime) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const duration = (localRoom.durationMinutes || 60) * 60 * 1000;
      const elapsed = Date.now() - localRoom.startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [viewMode, localRoom?.isStarted, localRoom?.startTime, localRoom?.durationMinutes]);


  // --- HANDLERS: LOBBY ---
  const handleCreateRoom = () => {
    if (!newOrgName) return;
    const code = createNewRoom(newOrgName, newTeamCount, newDurationMinutes);
    activateRoom(code);

    // Switch to dashboard
    const room = getRoomData();
    setLocalRoom(room);
    setViewMode('DASHBOARD');
    setNewOrgName('');
  };

  const handleEnterRoom = (code: string) => {
    activateRoom(code);
    const room = getRoomData();
    setLocalRoom(room);
    setViewMode('DASHBOARD');
  };

  const handleDeleteRoom = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말로 이 방을 삭제하시겠습니까? 데이터는 복구되지 않습니다.")) {
        deleteRoom(code);
        setRoomList(getGameRegistry());
    }
  };

  const handleBackToLobby = () => {
      clearActiveGameData();
      setLocalRoom(null);
      setViewMode('LOBBY');
  };

  // --- HANDLERS: DASHBOARD ---
  const handleStartGame = () => {
    if (!localRoom) return;
    const updatedRoom = { ...localRoom, isStarted: true, startTime: Date.now() };
    saveRoomData(updatedRoom);
    setLocalRoom(updatedRoom);
    setTimeout(broadcastState, 100); 
  };

  const handleEndGame = () => {
    if (!localRoom) return;
    const updatedRoom = { ...localRoom, isEnded: true };
    saveRoomData(updatedRoom);
    setLocalRoom(updatedRoom);
    setShowResults(true);
    setTimeout(broadcastState, 100);
  };

  const calculateTotalTime = (team: TeamData) => {
     if (!team.finishTime || !localRoom?.startTime) return 99999999999;
     const rawDuration = team.finishTime - localRoom.startTime;
     const penalty = team.hintCount * 5 * 60 * 1000;
     return rawDuration + penalty;
  };

  const getSortedTeams = () => {
    return (Object.values(teams) as TeamData[]).sort((a, b) => {
      const timeA = calculateTotalTime(a);
      const timeB = calculateTotalTime(b);
      
      if (a.finishTime && b.finishTime) {
          return timeA - timeB;
      }
      if (a.finishTime) return -1;
      if (b.finishTime) return 1;
      
      return b.completedLocations.length - a.completedLocations.length;
    });
  };

  const getTotalMemberCount = () => {
      return (Object.values(teams) as TeamData[]).reduce((acc, team) => acc + (team.members ? team.members.length : 0), 0);
  };

  const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isUrgent = timeLeft !== null && timeLeft < 5 * 60 * 1000; // Less than 5 minutes

  // Helper to render Bomb Status indicators
  const BombStatus = ({
    label,
    isActive,
    isCompleted,
    isLocked,
    subPuzzlesToCheck,
    solvedSubPuzzles = [],
    hideLabel = false
  }: {
    label: string,
    isActive: boolean,
    isCompleted: boolean,
    isLocked: boolean,
    subPuzzlesToCheck: string[],
    solvedSubPuzzles?: string[],
    hideLabel?: boolean
  }) => {
      // Extract just "Nuke A", "Nuke B", "Nuke C" without city names when hiding
      const parts = label.split(' ');
      const shortLabel = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : label; // "Nuke A (SF)" -> "Nuke A"
      const displayLabel = hideLabel ? shortLabel : label;

      return (
          <div className={`flex flex-col items-center gap-1 p-2 rounded-lg border flex-1 transition-all
              ${isCompleted ? 'bg-imf-cyan/10 border-imf-cyan text-imf-cyan' :
                isActive ? 'bg-red-900/20 border-red-500 text-red-500 animate-pulse-slow' :
                'bg-gray-800/50 border-gray-700 text-gray-600 grayscale'}
          `}>
              <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-tighter">
                  {isCompleted ? <ShieldCheck size={12} /> : isActive ? <Bomb size={12} className="animate-pulse" /> : <Ban size={12} />}
                  {displayLabel}
              </div>

              {/* Sub-Puzzle Dots */}
              {subPuzzlesToCheck.length > 0 && (
                  <div className="flex gap-1 mt-1">
                      {subPuzzlesToCheck.map((code) => {
                          const isSolved = solvedSubPuzzles.includes(code);
                          return (
                              <div
                                key={code}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${isSolved ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : isActive ? 'bg-red-900' : 'bg-gray-700'}`}
                                title={code}
                              />
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  // --- Render: LOBBY VIEW ---
  if (viewMode === 'LOBBY') {
      return (
        <div className="min-h-screen bg-imf-black text-gray-200 p-8 flex flex-col items-center">
             <BackgroundMusic />
             <div className="max-w-4xl w-full">
                <header className="flex items-center justify-between mb-12 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-imf-cyan tracking-widest uppercase">Mission Control</h1>
                        <p className="text-gray-500 font-mono text-sm">SELECT OPERATION OR INITIALIZE NEW</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create New Room Panel */}
                    <div className="bg-imf-dark border border-gray-700 p-8 rounded-xl shadow-lg h-fit">
                        <div className="flex items-center gap-2 mb-6 text-imf-cyan">
                            <PlusSquare size={24} />
                            <h2 className="text-xl font-bold uppercase tracking-wider">신규 작전 개설</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-white">기관/단체명</label>
                                <input 
                                type="text" 
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                                className="w-full bg-black border border-gray-700 p-4 rounded text-white focus:border-imf-cyan outline-none transition-colors"
                                placeholder="예: 00전자 신입연수"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-white">참가 조 (Teams): <span className="text-imf-cyan">{newTeamCount}</span></label>
                                <input
                                type="range"
                                min="2"
                                max="20"
                                value={newTeamCount}
                                onChange={(e) => setNewTeamCount(Number(e.target.value))}
                                className="w-full accent-imf-cyan h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-white">미션 수행 시간: <span className="text-imf-gold">{newDurationMinutes}분</span></label>
                                <input
                                type="range"
                                min="10"
                                max="120"
                                step="5"
                                value={newDurationMinutes}
                                onChange={(e) => setNewDurationMinutes(Number(e.target.value))}
                                className="w-full accent-imf-gold h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>10분</span>
                                    <span>60분</span>
                                    <span>120분</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleCreateRoom}
                                disabled={!newOrgName}
                                className="w-full bg-imf-cyan hover:bg-cyan-400 text-black font-bold py-4 rounded uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Activity size={20} /> 작전 개시 (Create)
                            </button>
                        </div>
                    </div>

                    {/* Room List Panel */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MonitorPlay size={24} className="text-gray-500" />
                            진행 중인 작전 목록 ({roomList.length})
                        </h2>
                        
                        {roomList.length === 0 ? (
                            <div className="p-8 border border-dashed border-gray-800 rounded-lg text-center text-gray-600 font-mono">
                                NO ACTIVE OPERATIONS FOUND
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {roomList.map((room) => (
                                    <div
                                        key={room.roomCode}
                                        onClick={() => handleEnterRoom(room.roomCode)}
                                        className="group bg-gray-900 border border-gray-800 hover:border-imf-cyan hover:bg-gray-800 p-5 rounded-lg cursor-pointer transition-all relative"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-imf-cyan transition-colors">{room.orgName}</h3>
                                                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-500">
                                                    <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                                                    {room.isEnded && <span className="text-red-500 font-bold">FINISHED</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <LogIn className="text-gray-600 group-hover:text-imf-cyan transition-colors" />
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => handleDeleteRoom(room.roomCode, e)}
                                            className="absolute top-4 right-4 p-2 text-gray-700 hover:text-red-500 transition-colors z-10"
                                            title="Delete Room"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
             </div>
             
             <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
             `}</style>
        </div>
      );
  }

  // --- Render: DASHBOARD VIEW (Existing UI) ---
  if (!localRoom) return <div className="p-8 text-center text-red-500">Error: No Room Data Loaded</div>;

  return (
    <div className="min-h-screen bg-imf-black text-gray-200 font-sans flex flex-col relative overflow-hidden">
       <AnimatedEarthBackground />
       <BackgroundMusic />
       
       {/* QR Code Modal */}
       {showQR && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setShowQR(false)}>
               <div className="bg-white p-6 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                    <h3 className="text-black font-bold text-xl mb-4">작전 참가 QR 코드</h3>
                    <div className="bg-white p-2 rounded">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('https://yja-mission.vercel.app/')}`}
                            alt="Room QR Code"
                            className="w-64 h-64"
                        />
                    </div>
                    <p className="mt-4 text-gray-600 font-mono text-center text-sm">
                        요원들은 카메라로 스캔하여<br/>앱에 접속 후 작전을 선택합니다.
                    </p>
                    <button
                        onClick={() => setShowQR(false)}
                        className="mt-6 text-gray-500 hover:text-black"
                    >
                        닫기 (Close)
                    </button>
               </div>
           </div>
       )}
       
       {/* Dashboard Header */}
       <header className="bg-imf-dark/90 backdrop-blur-sm border-b border-imf-gray p-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-20 gap-4">
         <div className="flex items-center gap-4">
            <button onClick={handleBackToLobby} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors" title="Back to Lobby">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                    <Activity className="text-imf-red animate-pulse" />
                    {localRoom.orgName}
                </h2>
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                        {/* QR Button */}
                        <button
                            onClick={() => setShowQR(true)}
                            className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded transition-all border bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                            <QrCode size={14} /> 참가 QR
                        </button>

                        {localRoom.isStarted && !localRoom.isEnded && (
                        <span className="text-xs text-imf-gold font-mono animate-pulse">OPERATION IN PROGRESS</span>
                        )}
                    </div>
                </div>
            </div>
         </div>
         
         {/* Timer Display */}
         {timeLeft !== null && (
           <div className={`px-6 py-2 rounded-lg border flex flex-col items-center transition-colors ${isUrgent ? 'bg-red-900/50 border-red-500 animate-pulse' : 'bg-gray-900 border-gray-700'}`}>
               <span className="text-[10px] text-gray-500 font-mono uppercase">남은 시간</span>
               <div className={`flex items-center gap-2 text-2xl font-bold font-mono ${isUrgent ? 'text-red-500' : 'text-imf-gold'}`}>
                   <Clock size={20} className={isUrgent ? 'animate-spin' : ''} />
                   {formatTime(timeLeft)}
               </div>
           </div>
         )}

         {/* Total User Counter */}
         <div className="bg-gray-900 px-6 py-2 rounded-lg border border-gray-700 flex flex-col items-center">
             <span className="text-[10px] text-gray-500 font-mono uppercase">Total Agents</span>
             <div className="flex items-center gap-2 text-2xl font-bold text-white">
                 <Users size={20} className="text-imf-cyan" />
                 {getTotalMemberCount()}
                 <span className="text-sm text-gray-500 font-normal self-end mb-1">명</span>
             </div>
         </div>

         <div className="flex items-center gap-4">
            {/* Spectator Mode Toggle */}
            <button
                onClick={() => setSpectatorMode(!spectatorMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-sm transition-all ${spectatorMode ? 'bg-imf-cyan text-black' : 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                title={spectatorMode ? '관리자 모드로 전환' : '참가자 화면으로 전환 (도시명 숨김)'}
            >
                {spectatorMode ? <EyeOff size={16} /> : <Eye size={16} />}
                {spectatorMode ? '관리자 모드' : '참가자 화면'}
            </button>
            {!localRoom.isStarted ? (
               <button onClick={handleStartGame} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold uppercase tracking-wide animate-pulse shadow-[0_0_15px_rgba(0,255,0,0.3)]">
                 <Play size={18} /> 미션 시작 (Start)
               </button>
            ) : !localRoom.isEnded ? (
               <button onClick={handleEndGame} className="bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-mono">
                 결과 확인 (Finish)
               </button>
            ) : (
              <button onClick={() => setShowResults(!showResults)} className="bg-imf-gold/20 text-imf-gold border border-imf-gold px-4 py-2 rounded font-bold">
                {showResults ? '대시보드 보기' : '순위표 보기'}
              </button>
            )}
         </div>
       </header>

       {/* Main Content */}
       <main className="flex-1 p-6 overflow-y-auto relative z-10">
         {showResults ? (
           // Results View
           <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl text-center font-bold text-imf-gold mb-8 uppercase tracking-[0.5em] drop-shadow-lg">Final Mission Report</h1>
              <div className="space-y-4">
                {getSortedTeams().map((team, index) => {
                  const finalTimeMs = calculateTotalTime(team);
                  const minutes = Math.floor(finalTimeMs / 60000);
                  const seconds = Math.floor((finalTimeMs % 60000) / 1000);
                  
                  return (
                    <div key={team.teamId} className={`relative flex items-center justify-between p-6 rounded-lg border ${index === 0 ? 'bg-gradient-to-r from-yellow-900/30 to-black border-imf-gold' : 'bg-gray-900 border-gray-700'}`}>
                       <div className="flex items-center gap-6">
                          <div className={`text-4xl font-black font-mono w-16 text-center ${index === 0 ? 'text-imf-gold' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-gray-600'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Users size={14} className="text-gray-500" />
                                <p className="text-sm text-gray-300 font-mono">
                                    {team.members && team.members.length > 0 ? team.members.join(', ') : 'No Agents'}
                                </p>
                            </div>
                          </div>
                       </div>
                       
                       <div className="text-right">
                          {team.finishTime ? (
                            <>
                              <div className="text-3xl font-mono font-bold text-imf-cyan">{minutes}분 {seconds}초</div>
                              <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                                  <span>Base: {Math.floor((team.finishTime - (localRoom?.startTime || 0))/60000)}m {Math.floor(((team.finishTime - (localRoom?.startTime || 0))%60000)/1000)}s</span>
                                  <span className="text-imf-red">Penalty: +{team.hintCount * 5}m</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-red-500 font-bold uppercase tracking-widest">Failed / Incomplete</div>
                          )}
                       </div>
                       {index === 0 && <Trophy className="absolute -top-4 -right-4 text-imf-gold w-12 h-12 drop-shadow-glow animate-bounce" />}
                    </div>
                  );
                })}
              </div>
           </div>
         ) : (
           // Live Grid View with Detailed Bomb Status
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
             {(Object.values(teams) as TeamData[]).map((team) => {
               const isFinished = !!team.finishTime;
               const solvedSub = team.solvedSubPuzzles || [];
               const comp = team.completedLocations;
               
               // Logic to determine active states
               const isBlueHouseDone = comp.includes(LocationId.BLUE_HOUSE);
               const isSFDone = comp.includes(LocationId.SAN_FRANCISCO);
               const isFranceDone = comp.includes(LocationId.FRANCE);
               const isIncheonDone = comp.includes(LocationId.INCHEON_AIRPORT);

               return (
                 <div key={team.teamId} className={`bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg ${isFinished ? 'border-imf-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]' : ''}`}>
                    <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-2">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {team.name}
                            {isFinished && <Trophy size={16} className="text-imf-gold" />}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm bg-black/40 px-2 py-1 rounded">
                             <Users size={14} className="text-gray-400" />
                             <span className="text-white font-bold">{team.members.length}명</span>
                             <span className="text-gray-500 text-xs truncate max-w-[200px]">
                                {team.members.length > 0 ? `(${team.members.join(', ')})` : '(대기 중)'}
                             </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                         {team.hintCount > 0 && (
                             <div className="text-imf-red text-xs font-bold flex items-center gap-1 justify-end">
                                 <Ban size={12} /> HINTS: {team.hintCount}
                             </div>
                         )}
                         <div className="text-xs text-gray-500 font-mono mt-1">
                             {isFinished ? 'MISSION COMPLETED' : 'STATUS: ACTIVE'}
                         </div>
                      </div>
                    </div>

                    {/* Progress Trackers */}
                    <div className="flex gap-2 w-full">
                        {/* 1. Bomb A (SF) */}
                        <BombStatus
                            label="Nuke A (SF)"
                            isActive={isBlueHouseDone && !isSFDone}
                            isCompleted={isSFDone}
                            isLocked={!isBlueHouseDone}
                            subPuzzlesToCheck={['codeA-1', 'codeA-2', 'codeA-3']}
                            solvedSubPuzzles={solvedSub}
                            hideLabel={spectatorMode}
                        />

                        {/* 2. Bomb B (France) */}
                        <BombStatus
                            label="Nuke B (PARIS)"
                            isActive={isSFDone && !isFranceDone}
                            isCompleted={isFranceDone}
                            isLocked={!isSFDone}
                            subPuzzlesToCheck={['codeB-1', 'codeB-2', 'codeB-3']}
                            solvedSubPuzzles={solvedSub}
                            hideLabel={spectatorMode}
                        />

                        {/* 3. Bomb C (Incheon) */}
                        <BombStatus
                            label="Nuke C (INC)"
                            isActive={isFranceDone && !isIncheonDone}
                            isCompleted={isIncheonDone}
                            isLocked={!isFranceDone}
                            subPuzzlesToCheck={['codeC-1', 'codeC-2', 'codeC-3']}
                            solvedSubPuzzles={solvedSub}
                            hideLabel={spectatorMode}
                        />
                    </div>
                 </div>
               );
             })}
           </div>
         )}
       </main>
    </div>
  );
};

export default AdminDashboard;