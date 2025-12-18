import React, { useState, useEffect } from 'react';
import { RoomData, TeamData, RoomSummary } from '../types';
import { getTeamsData, getGameRegistry, clearActiveGameData, activateRoom } from '../services/storageService';
import { joinRoom, sendClientAction, disconnect } from '../services/networkService';
import { subscribeToRooms } from '../services/firebaseService';
import { User, Users, LogIn, Loader2, Activity, Globe, MonitorX, ArrowLeft, Play, Clock } from 'lucide-react';

interface Props {
  room: RoomData | null;
  onJoin: (name: string, teamId: number) => void;
  onBack: () => void;
}

const UserJoin: React.FC<Props> = ({ room, onJoin, onBack }) => {
  // --- STATE ---
  const [step, setStep] = useState<'SELECT_ROOM' | 'PROFILE'>('SELECT_ROOM');
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomSummary[]>([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Record<number, TeamData>>({});

  // --- EFFECTS ---

  useEffect(() => {
    // First, load from local registry as fallback
    const localRegistry = getGameRegistry();
    if (localRegistry.length > 0) {
      const sorted = [...localRegistry].sort((a, b) => {
        if (a.isEnded && !b.isEnded) return 1;
        if (!a.isEnded && b.isEnded) return -1;
        return b.createdAt - a.createdAt;
      });
      setAvailableRooms(sorted);
    }

    // Subscribe to Firebase for real-time cross-device room discovery
    const unsubscribe = subscribeToRooms((firebaseRooms) => {
      // Merge Firebase rooms with local registry
      const localRooms = getGameRegistry();
      const mergedMap = new Map<string, RoomSummary>();

      // Add local rooms first
      localRooms.forEach(room => mergedMap.set(room.roomCode, room));

      // Firebase rooms take precedence (for cross-device discovery)
      firebaseRooms.forEach(room => mergedMap.set(room.roomCode, room));

      const merged = Array.from(mergedMap.values());

      // Sort: active first, then by createdAt descending
      merged.sort((a, b) => {
        if (a.isEnded && !b.isEnded) return 1;
        if (!a.isEnded && b.isEnded) return -1;
        return b.createdAt - a.createdAt;
      });

      setAvailableRooms(merged);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for team data updates
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

  const handleSelectRoom = (roomCode: string) => {
    setIsConnecting(true);
    setSelectedRoomCode(roomCode);

    // Activate room from registry
    activateRoom(roomCode);

    // Small delay to ensure data loading
    setTimeout(() => {
      setIsConnecting(false);
      setTeams(getTeamsData());
      setStep('PROFILE');

      // Attempt network connection in background for sync
      joinRoom(roomCode, () => {}, () => {});
    }, 300);
  };

  const handleJoinGame = () => {
    if (name && selectedTeam) {
      // Send join request to host
      sendClientAction('JOIN_REQUEST', { teamId: selectedTeam, name });
      // Notify parent app to switch to Waiting Room
      onJoin(name, selectedTeam);
    }
  };

  const handleBackToRoomList = () => {
    disconnect();
    clearActiveGameData();
    setStep('SELECT_ROOM');
    setSelectedTeam(null);
    setSelectedRoomCode(null);
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

        {/* STEP 1: SELECT ROOM */}
        {step === 'SELECT_ROOM' && (
          <div className="bg-imf-dark/80 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 min-h-[400px] flex flex-col">

            <div className="flex items-center gap-2 mb-6">
              <Activity size={18} className="text-imf-cyan animate-pulse" />
              <label className="text-white font-bold">참가할 작전 선택</label>
            </div>

            {availableRooms.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-lg p-8 bg-black/20">
                <MonitorX size={48} className="mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-gray-500 mb-2">진행 중인 작전이 없습니다</h3>
                <p className="text-xs text-center max-w-[200px]">
                  관리자가 작전을 개설할 때까지 기다려주세요.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-1 flex-1">
                {availableRooms.map((r) => (
                  <button
                    key={r.roomCode}
                    onClick={() => handleSelectRoom(r.roomCode)}
                    disabled={isConnecting}
                    className={`w-full relative group bg-gray-900/50 hover:bg-gray-800 border p-5 rounded-lg flex justify-between items-center transition-all text-left overflow-hidden
                      ${r.isEnded ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-imf-cyan'}
                      ${isConnecting && selectedRoomCode === r.roomCode ? 'border-imf-cyan bg-gray-800' : ''}
                    `}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${r.isEnded ? 'bg-gray-700' : 'bg-imf-cyan group-hover:bg-imf-cyan'}`}></div>

                    <div className="pl-2 flex-1">
                      <div className="font-bold text-white text-lg group-hover:text-imf-cyan transition-colors flex items-center gap-2">
                        {r.orgName}
                        {r.isEnded ? (
                          <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">종료됨</span>
                        ) : (
                          <span className="text-[10px] bg-green-900 text-green-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Play size={8} /> 진행중
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs font-mono text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border shadow-lg
                      ${r.isEnded ? 'bg-gray-800 border-gray-700 text-gray-600' : 'bg-black border-gray-700 group-hover:bg-imf-cyan group-hover:text-black group-hover:border-imf-cyan'}
                    `}>
                      {isConnecting && selectedRoomCode === r.roomCode ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <LogIn size={20} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isConnecting && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="bg-imf-dark border border-imf-cyan p-6 rounded-lg shadow-2xl flex flex-col items-center">
                  <Loader2 className="animate-spin text-imf-cyan w-10 h-10 mb-4" />
                  <p className="text-white font-bold">작전에 연결 중...</p>
                  <p className="text-xs text-imf-cyan font-mono mt-1">CONNECTING TO OPERATION</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROFILE & TEAM */}
        {step === 'PROFILE' && room && (
          <div className="bg-imf-dark/80 backdrop-blur-md border border-imf-cyan/30 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-right-4">

            {/* Connection Status Header */}
            <div className="flex items-center justify-between mb-6 bg-imf-cyan/5 p-3 rounded border border-imf-cyan/20">
              <div>
                <div className="text-[10px] text-imf-cyan font-mono tracking-wider">CONNECTED TO OPERATION</div>
                <div className="text-white font-bold text-lg">{room.orgName}</div>
              </div>
              <button onClick={handleBackToRoomList} className="text-xs text-red-400 hover:text-red-300 underline">
                다른 작전 선택
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default UserJoin;
