import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Stage, LocationId, RoomData, TeamData } from './types';
import { PUZZLES } from './constants';
import {
  subscribeToRoom,
  subscribeToTeams,
  updateTeam,
  solveSubPuzzle,
  completeStage,
  useHint,
  joinTeam
} from './services/firebaseService';
import { ScanlineOverlay } from './components/VisualEffects';

// Screens
import IntroScreen from './components/IntroScreen';
import MapScreen from './components/MapScreen';
import PuzzleView from './components/PuzzleView';
import SuccessScreen from './components/SuccessScreen';
import FailureScreen from './components/FailureScreen';
import Timer from './components/Timer';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import UserJoin from './components/UserJoin';
import { UserCog, Users } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    stage: Stage.LOGIN_SELECT,
    myTeamId: null,
    myName: null,
    currentLocationId: null,
    room: null,
    teams: {},
  });

  // 현재 방 코드 저장 (Firebase 구독용)
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);

  // Derived state for current user's team
  const currentTeam = gameState.myTeamId ? gameState.teams[gameState.myTeamId] : null;
  const unlockedLocations = currentTeam?.unlockedLocations ?? [];
  const completedLocations = currentTeam?.completedLocations ?? [];
  const solvedSubPuzzles = currentTeam?.solvedSubPuzzles ?? [];
  const completionTimes = currentTeam?.completionTimes ?? {};
  const hintCount = currentTeam?.hintCount ?? 0;

  // Firebase 실시간 구독
  useEffect(() => {
    if (!currentRoomCode) return;

    // 방 정보 구독
    const unsubRoom = subscribeToRoom(currentRoomCode, (room) => {
      setGameState(prev => {
        let nextStage = prev.stage;
        let nextLocationId = prev.currentLocationId;

        // 대기실에서 게임 시작되면 자동 전환
        if (prev.stage === Stage.WAITING_ROOM && room?.isStarted) {
          nextStage = Stage.PUZZLE_VIEW;
          nextLocationId = LocationId.BLUE_HOUSE;
        }

        return {
          ...prev,
          room,
          stage: nextStage,
          currentLocationId: nextLocationId
        };
      });
    });

    // 팀 정보 구독
    const unsubTeams = subscribeToTeams(currentRoomCode, (teams) => {
      setGameState(prev => ({ ...prev, teams }));
    });

    return () => {
      unsubRoom();
      unsubTeams();
    };
  }, [currentRoomCode]);

  // --- Handlers ---

  const handleAdminLoginSuccess = () => {
    setGameState(prev => ({ ...prev, stage: Stage.ADMIN_DASHBOARD }));
  };

  const handleUserJoin = useCallback(async (name: string, teamId: number, roomCode: string) => {
    // Firebase에 팀 합류 저장
    await joinTeam(roomCode, teamId, name);

    setCurrentRoomCode(roomCode);
    setGameState(prev => ({
      ...prev,
      myName: name,
      myTeamId: teamId,
      stage: Stage.WAITING_ROOM
    }));
  }, []);

  const handleRoomConnect = useCallback((roomCode: string) => {
    setCurrentRoomCode(roomCode);
  }, []);

  const handleStartGame = () => {
    setGameState(prev => ({
      ...prev,
      stage: Stage.MAP,
    }));
  };

  const handleTimeExpire = () => {
    setGameState(prev => ({
      ...prev,
      stage: Stage.FAILURE
    }));
  };

  const handleSelectLocation = (id: LocationId) => {
    setGameState(prev => ({
      ...prev,
      stage: Stage.PUZZLE_VIEW,
      currentLocationId: id
    }));
  };

  const handleBackToMap = () => {
    setGameState(prev => ({
      ...prev,
      stage: Stage.MAP,
      currentLocationId: null
    }));
  };

  // 서브퍼즐 해결 (Firebase)
  const handleSubPuzzleSolve = useCallback(async (subPuzzleId: string) => {
    const { myTeamId } = gameState;
    if (!myTeamId || !currentRoomCode) return;

    await solveSubPuzzle(currentRoomCode, myTeamId, subPuzzleId);
  }, [gameState.myTeamId, currentRoomCode]);

  // 스테이지 완료 (Firebase)
  const handleSolvePuzzle = useCallback(async () => {
    const { currentLocationId, myTeamId, teams } = gameState;
    if (!currentLocationId || !myTeamId || !currentRoomCode) return;

    const puzzle = PUZZLES[currentLocationId];
    const currentTeamData = teams[myTeamId];

    // Firebase 업데이트
    const isFinished = await completeStage(
      currentRoomCode,
      myTeamId,
      currentLocationId,
      puzzle.nextLocationId || null
    );

    // 로컬 상태 즉시 업데이트 (Firebase 동기화 기다리지 않음)
    const newCompletedLocations = [...(currentTeamData?.completedLocations || []), currentLocationId];
    const newUnlockedLocations = [...(currentTeamData?.unlockedLocations || [])];

    if (puzzle.nextLocationId && !newUnlockedLocations.includes(puzzle.nextLocationId)) {
      newUnlockedLocations.push(puzzle.nextLocationId);
    }

    const updatedTeams = {
      ...teams,
      [myTeamId]: {
        ...currentTeamData,
        completedLocations: newCompletedLocations,
        unlockedLocations: newUnlockedLocations,
      }
    };

    if (isFinished) {
      setGameState(prev => ({
        ...prev,
        teams: updatedTeams,
        stage: Stage.SUCCESS,
        currentLocationId: null
      }));
    } else {
      // 지도로 이동 (다음 위치가 활성화된 상태)
      setGameState(prev => ({
        ...prev,
        teams: updatedTeams,
        stage: Stage.MAP,
        currentLocationId: null
      }));
    }
  }, [gameState.currentLocationId, gameState.myTeamId, gameState.teams, currentRoomCode]);

  // 힌트 사용 (Firebase)
  const handleUseHint = useCallback(async () => {
    const { myTeamId } = gameState;
    if (!myTeamId || !currentRoomCode) return;

    await useHint(currentRoomCode, myTeamId);
  }, [gameState.myTeamId, currentRoomCode]);

  // --- Render Flow ---

  const renderContent = () => {
    // 1. Initial Selection Screen
    if (gameState.stage === Stage.LOGIN_SELECT) {
      return (
        <div className="min-h-screen bg-imf-black flex flex-col items-center justify-center p-6 space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-50 z-0"></div>

          <div className="text-center z-10 relative">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase glitch-layer-1" data-text="Mission: Protocol Fallout">Mission: Protocol Fallout</h1>
            <p className="text-imf-cyan font-mono tracking-widest text-sm animate-pulse">SECURE ACCESS TERMINAL</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl z-10 relative">
            <button
              onClick={() => setGameState(prev => ({ ...prev, stage: Stage.USER_JOIN }))}
              className="flex-1 bg-gray-900/80 backdrop-blur border border-gray-700 hover:border-imf-cyan hover:bg-gray-800 p-8 rounded-xl transition-all group hover:scale-[1.02] shadow-lg"
            >
              <Users className="w-12 h-12 text-imf-cyan mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold text-white mb-2">요원 접속 (Agent)</h3>
              <p className="text-sm text-gray-500 group-hover:text-gray-400">팀에 합류하여 미션을 수행합니다.</p>
            </button>

            <button
              onClick={() => setGameState(prev => ({ ...prev, stage: Stage.ADMIN_LOGIN }))}
              className="flex-1 bg-gray-900/80 backdrop-blur border border-gray-700 hover:border-imf-red hover:bg-gray-800 p-8 rounded-xl transition-all group hover:scale-[1.02] shadow-lg"
            >
              <UserCog className="w-12 h-12 text-imf-red mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold text-white mb-2">관리자 (Admin)</h3>
              <p className="text-sm text-gray-500 group-hover:text-gray-400">방을 개설하고 현황을 모니터링합니다.</p>
            </button>
          </div>
        </div>
      );
    }

    // 2. Admin Flows
    if (gameState.stage === Stage.ADMIN_LOGIN) {
      return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onBack={() => setGameState(prev => ({ ...prev, stage: Stage.LOGIN_SELECT }))} />;
    }
    if (gameState.stage === Stage.ADMIN_DASHBOARD) {
      return <AdminDashboard />;
    }

    // 3. User Flows
    if (gameState.stage === Stage.USER_JOIN) {
      return (
        <UserJoin
          onJoin={handleUserJoin}
          onBack={() => setGameState(prev => ({ ...prev, stage: Stage.LOGIN_SELECT }))}
          onRoomConnect={handleRoomConnect}
        />
      );
    }

    if (gameState.stage === Stage.WAITING_ROOM) {
      return (
        <div className="min-h-screen bg-imf-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover opacity-20 animate-pulse"></div>
          <div className="z-10 text-center">
            <div className="inline-block px-4 py-2 bg-imf-cyan/10 border border-imf-cyan rounded-full text-imf-cyan font-bold animate-pulse mb-6">
              WAITING FOR SIGNAL...
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">작전 대기 중</h1>
            <p className="text-gray-400 font-mono">관리자가 미션을 시작하면 자동으로 화면이 전환됩니다.</p>
            <div className="mt-8 text-xl font-bold text-white border-t border-b border-gray-700 py-4">
              {gameState.myTeamId}조 - {gameState.myName} 요원
            </div>
            {gameState.room && (
              <div className="mt-4 text-sm text-gray-500 font-mono">
                작전명: {gameState.room.orgName}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. Game Stages
    if (gameState.stage === Stage.INTRO) {
      return <IntroScreen onStart={handleStartGame} />;
    }

    if (gameState.stage === Stage.FAILURE) {
      return <FailureScreen />;
    }

    if (gameState.stage === Stage.SUCCESS) {
      return (
        <SuccessScreen
          gameStartTime={gameState.room?.startTime || Date.now()}
          completionTimes={completionTimes}
          hintCount={hintCount}
          finishTime={currentTeam?.finishTime || Date.now()}
        />
      );
    }

    // Main Game Loop (Map & Puzzles)
    return (
      <>
        {gameState.stage === Stage.PUZZLE_VIEW && gameState.currentLocationId ? (
          <PuzzleView
            puzzle={PUZZLES[gameState.currentLocationId]}
            onBack={handleBackToMap}
            onSolve={handleSolvePuzzle}
            onSubPuzzleSolve={handleSubPuzzleSolve}
            hintCount={hintCount}
            onUseHint={handleUseHint}
            solvedSubPuzzles={solvedSubPuzzles}
          />
        ) : (
          <MapScreen
            unlockedLocations={unlockedLocations}
            completedLocations={completedLocations}
            onSelectLocation={handleSelectLocation}
          />
        )}
      </>
    );
  };

  // Timer visibility
  const showTimer =
    gameState.room?.isStarted &&
    gameState.room?.startTime &&
    ![
      Stage.LOGIN_SELECT,
      Stage.ADMIN_LOGIN,
      Stage.ADMIN_DASHBOARD,
      Stage.USER_JOIN,
      Stage.WAITING_ROOM,
      Stage.SUCCESS,
      Stage.FAILURE
    ].includes(gameState.stage);

  return (
    <>
      <ScanlineOverlay />

      {showTimer && gameState.room?.startTime && (
        <Timer
          startTime={gameState.room.startTime}
          durationMinutes={60}
          onTimeExpire={handleTimeExpire}
        />
      )}

      {renderContent()}
    </>
  );
};

export default App;
