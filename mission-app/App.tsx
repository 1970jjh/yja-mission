import React, { useState, useEffect } from 'react';
import { GameState, Stage, LocationId, RoomData } from './types';
import { PUZZLES } from './constants';
import { getRoomData, getTeamsData, updateTeamProgress } from './services/storageService';
import { sendClientAction } from './services/networkService';
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

  // Derived state for current user's team to fix access in renderContent
  const currentTeam = gameState.myTeamId ? gameState.teams[gameState.myTeamId] : null;
  const unlockedLocations = currentTeam?.unlockedLocations ?? [];
  const completedLocations = currentTeam?.completedLocations ?? [];
  const solvedSubPuzzles = currentTeam?.solvedSubPuzzles ?? [];
  const completionTimes = currentTeam?.completionTimes ?? {};
  const hintCount = currentTeam?.hintCount ?? 0;

  // Sync Room Data globally
  useEffect(() => {
    const syncData = () => {
      const room = getRoomData();
      const teams = getTeamsData();
      
      setGameState(prev => {
        // If user is waiting in room and game starts, move directly to Blue House Puzzle
        let nextStage = prev.stage;
        let nextLocationId = prev.currentLocationId;
        
        if (prev.stage === Stage.WAITING_ROOM && room?.isStarted) {
           nextStage = Stage.PUZZLE_VIEW;
           nextLocationId = LocationId.BLUE_HOUSE;
        }
        
        // If game ended, move to success (or result view)
        if (room?.isEnded && prev.stage !== Stage.SUCCESS && prev.stage !== Stage.ADMIN_DASHBOARD) {
            // Optional: could force move to a game over screen here
        }

        return { 
            ...prev, 
            room, 
            teams, 
            stage: nextStage,
            currentLocationId: nextLocationId 
        };
      });
    };

    syncData();
    window.addEventListener('storage', syncData);
    const interval = setInterval(syncData, 1000); // Polling backup
    return () => {
      window.removeEventListener('storage', syncData);
      clearInterval(interval);
    }
  }, []);

  // --- Handlers ---

  const handleAdminLoginSuccess = () => {
    setGameState(prev => ({ ...prev, stage: Stage.ADMIN_DASHBOARD }));
  };

  const handleUserJoin = (name: string, teamId: number) => {
    setGameState(prev => ({
      ...prev,
      myName: name,
      myTeamId: teamId,
      stage: Stage.WAITING_ROOM
    }));
  };

  const handleStartGame = () => {
    // Legacy handler (if using Intro screen manually), usually Admin starts game now.
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

  // NEW: Handle granular sub-puzzle solving (A-1, A-2, etc.)
  const handleSubPuzzleSolve = (subPuzzleId: string) => {
    const { myTeamId, teams } = gameState;
    if (!myTeamId) return;

    const currentTeam = teams[myTeamId];
    if (!currentTeam) return;

    // Avoid duplicates
    if (!currentTeam.solvedSubPuzzles?.includes(subPuzzleId)) {
        const newSolved = [...(currentTeam.solvedSubPuzzles || []), subPuzzleId];
        const updates = { solvedSubPuzzles: newSolved };
        
        // Persist
        updateTeamProgress(myTeamId, updates);
        // Broadcast
        sendClientAction('UPDATE_TEAM', { teamId: myTeamId, updates });
    }
  };

  const handleSolvePuzzle = () => {
    const { currentLocationId, myTeamId, teams } = gameState;
    if (!currentLocationId || !myTeamId) return;
    
    // Update local and storage state for the team
    const currentTeam = teams[myTeamId];
    if (!currentTeam) return;

    const newCompleted = [...currentTeam.completedLocations, currentLocationId];
    const newUnlocked = [...currentTeam.unlockedLocations];
    const newCompletionTimes = { ...currentTeam.completionTimes, [currentLocationId]: Date.now() };

    const puzzle = PUZZLES[currentLocationId];
    let isFinished = false;

    if (puzzle.nextLocationId) {
       if (!newUnlocked.includes(puzzle.nextLocationId)) {
         newUnlocked.push(puzzle.nextLocationId);
       }
    } else {
      // End Game
      isFinished = true;
    }

    const updates = {
      completedLocations: newCompleted,
      unlockedLocations: newUnlocked,
      completionTimes: newCompletionTimes,
      finishTime: isFinished ? Date.now() : null,
      currentLocationId: null // Reset current location on map
    };

    // Persist to storage
    updateTeamProgress(myTeamId, updates);
    
    // Broadcast to Admin
    sendClientAction('UPDATE_TEAM', { teamId: myTeamId, updates });

    // Update Local UI
    setGameState(prev => ({
       ...prev,
       stage: isFinished ? Stage.SUCCESS : Stage.MAP,
       currentLocationId: null
    }));
  };

  const handleUseHint = () => {
    const { myTeamId, teams } = gameState;
    if (myTeamId && teams[myTeamId]) {
       const newCount = teams[myTeamId].hintCount + 1;
       const updates = { hintCount: newCount };
       updateTeamProgress(myTeamId, updates);
       sendClientAction('UPDATE_TEAM', { teamId: myTeamId, updates });
    }
  };

  // --- Render Flow ---

  const renderContent = () => {
    // 1. Initial Selection Screen
    if (gameState.stage === Stage.LOGIN_SELECT) {
        return (
        <div className="min-h-screen bg-imf-black flex flex-col items-center justify-center p-6 space-y-8 relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-50 z-0"></div>
            
            <div className="text-center z-10 relative">
                <h1 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase glitch-layer-1" data-text="Mission: Protocol Fallout">Mission: Protocol Fallout</h1>
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
        return <AdminDashboard room={gameState.room} />;
    }

    // 3. User Flows
    if (gameState.stage === Stage.USER_JOIN) {
        return <UserJoin room={gameState.room} onJoin={handleUserJoin} onBack={() => setGameState(prev => ({ ...prev, stage: Stage.LOGIN_SELECT }))} />;
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
                    solvedSubPuzzles={solvedSubPuzzles} // Pass global state
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

  // Determine if we should show the global timer
  // Show timer if:
  // 1. Room is started and has a start time
  // 2. Not in Admin screens
  // 3. Not in Login/Join/Waiting screens (unless you want it there, but usually only after start)
  // 4. Not in Success/Failure (timer stops visually or is hidden)
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
        
        {/* Global Timer Overlay */}
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