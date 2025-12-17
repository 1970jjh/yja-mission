import React, { useState, useEffect } from 'react';
import { RoomData, TeamData } from '../types';
import { getRoom, getTeams, subscribeToTeams } from '../services/firebaseService';
import { User, Users, LogIn, Wifi, Loader2, Activity, Globe, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';

interface Props {
  onJoin: (name: string, teamId: number, roomCode: string) => void;
  onBack: () => void;
  onRoomConnect: (roomCode: string) => void;
}

const UserJoin: React.FC<Props> = ({ onJoin, onBack, onRoomConnect }) => {
  // --- STATE ---
  const [step, setStep] = useState<'INPUT' | 'PROFILE'>('INPUT');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [room, setRoom] = useState<RoomData | null>(null);
  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [teams, setTeams] = useState<Record<number, TeamData>>({});

  // --- EFFECTS ---

  // URL에서 room 파라미터 확인 (QR 코드/링크 접속 시)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomCode = params.get('room');
    if (urlRoomCode && step === 'INPUT') {
      setRoomCodeInput(urlRoomCode.toUpperCase());
      handleConnect(urlRoomCode.toUpperCase());
    }
  }, []);

  // 방 연결 후 팀 정보 실시간 구독
  useEffect(() => {
    if (!room?.roomCode) return;

    const unsubscribe = subscribeToTeams(room.roomCode, (teamsData) => {
      setTeams(teamsData);
    });

    return () => unsubscribe();
  }, [room?.roomCode]);

  // --- HANDLERS ---

  const handleConnect = async (codeOverride?: string) => {
    const codeToUse = (codeOverride || roomCodeInput || '').trim().toUpperCase();
    if (!codeToUse || codeToUse.length < 6) return;

    setIsConnecting(true);
    setConnectError('');

    try {
      // Firebase에서 방 정보 조회
      const roomData = await getRoom(codeToUse);

      if (!roomData) {
        setConnectError('작전을 찾을 수 없습니다. 코드를 확인하세요.');
        setIsConnecting(false);
        return;
      }

      // 방 정보 저장
      setRoom(roomData);
      onRoomConnect(codeToUse);

      // 팀 정보 조회
      const teamsData = await getTeams(codeToUse);
      setTeams(teamsData);

      setStep('PROFILE');
    } catch (error) {
      console.error('Connection error:', error);
      setConnectError('연결 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinGame = () => {
    if (name && selectedTeam && room) {
      onJoin(name, selectedTeam, room.roomCode);
    }
  };

  const handleBackToConnect = () => {
    setRoom(null);
    setStep('INPUT');
    setSelectedTeam(null);
    setConnectError('');
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-imf-black p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Bg Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black z-0"></div>

      {/* Back Button */}
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

        {/* STEP 1: 코드 입력 */}
        {step === 'INPUT' && (
          <div className="bg-imf-dark/80 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-2xl min-h-[350px] flex flex-col">

            <div className="flex items-center gap-2 mb-6 text-white font-bold">
              <KeyRound size={18} className="text-imf-cyan" />
              작전 코드 입력
            </div>

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
                {isConnecting ? <Loader2 className="animate-spin" /> : <Wifi size={20} />}
                {isConnecting ? '연결 중...' : '접속 승인 요청'}
              </button>

              {connectError && (
                <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-950/30 p-3 rounded border border-red-900/50 justify-center">
                  <AlertCircle size={16} /> {connectError}
                </div>
              )}

              <p className="mt-6 text-xs text-gray-500 text-center">
                * 관리자 화면(PC)에 표시된 6자리 코드를 입력하거나<br />QR 코드를 스캔하세요.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: 이름/팀 선택 */}
        {step === 'PROFILE' && room && (
          <div className="bg-imf-dark/80 backdrop-blur-md border border-imf-cyan/30 rounded-xl p-6 shadow-2xl">

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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default UserJoin;
