import { RoomData, TeamData, LocationId, RoomSummary } from '../types';

// Active Session Keys (The "Current" Game)
const KEY_ACTIVE_ROOM = 'imf_room_data';
const KEY_ACTIVE_TEAMS = 'imf_teams_data';

// Registry Key (List of all games)
const KEY_GAME_REGISTRY = 'imf_game_registry';

// Namespacing Helpers
const getRoomKey = (code: string) => `imf_room_${code}`;
const getTeamsKey = (code: string) => `imf_teams_${code}`;

// --- Registry Management ---

export const getGameRegistry = (): RoomSummary[] => {
  const data = localStorage.getItem(KEY_GAME_REGISTRY);
  return data ? JSON.parse(data) : [];
};

const addToRegistry = (summary: RoomSummary) => {
  const registry = getGameRegistry();
  // Avoid duplicates
  if (!registry.find(r => r.roomCode === summary.roomCode)) {
    registry.unshift(summary); // Add to top
    localStorage.setItem(KEY_GAME_REGISTRY, JSON.stringify(registry));
  }
};

const removeFromRegistry = (roomCode: string) => {
  const registry = getGameRegistry().filter(r => r.roomCode !== roomCode);
  localStorage.setItem(KEY_GAME_REGISTRY, JSON.stringify(registry));
};

// --- Multi-Room Creation & Switching ---

export const createNewRoom = (orgName: string, totalTeams: number, durationMinutes: number = 60): string => {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newRoom: RoomData = {
    orgName,
    totalTeams,
    isStarted: false,
    startTime: null,
    isEnded: false,
    roomCode,
    durationMinutes
  };

  const newTeams: Record<number, TeamData> = {};
  for (let i = 1; i <= totalTeams; i++) {
    newTeams[i] = {
      teamId: i,
      name: `${i}조`,
      members: [],
      currentLocationId: null,
      unlockedLocations: [LocationId.BLUE_HOUSE],
      completedLocations: [],
      solvedSubPuzzles: [], // Init empty
      completionTimes: {},
      finishTime: null,
      hintCount: 0,
      isDead: false,
    };
  }

  // Save to persistent namespaced storage
  localStorage.setItem(getRoomKey(roomCode), JSON.stringify(newRoom));
  localStorage.setItem(getTeamsKey(roomCode), JSON.stringify(newTeams));

  // Add to registry
  addToRegistry({
    roomCode,
    orgName,
    createdAt: Date.now(),
    isEnded: false
  });

  return roomCode;
};

export const activateRoom = (roomCode: string) => {
  // Load data from namespaced storage
  const savedRoom = localStorage.getItem(getRoomKey(roomCode));
  const savedTeams = localStorage.getItem(getTeamsKey(roomCode));

  if (savedRoom && savedTeams) {
    // Set as Active Session
    localStorage.setItem(KEY_ACTIVE_ROOM, savedRoom);
    localStorage.setItem(KEY_ACTIVE_TEAMS, savedTeams);
    window.dispatchEvent(new Event('storage'));
  }
};

export const deleteRoom = (roomCode: string) => {
  localStorage.removeItem(getRoomKey(roomCode));
  localStorage.removeItem(getTeamsKey(roomCode));
  removeFromRegistry(roomCode);
  
  // If deleting the currently active room, clear active state
  const current = getRoomData();
  if (current?.roomCode === roomCode) {
    clearActiveGameData();
  }
};

// --- Active Session Management (Used by App UI) ---

export const saveRoomData = (data: RoomData) => {
  // 1. Save to Active Session
  localStorage.setItem(KEY_ACTIVE_ROOM, JSON.stringify(data));
  
  // 2. Persist to Namespaced Storage (Backup)
  if (data.roomCode) {
    localStorage.setItem(getRoomKey(data.roomCode), JSON.stringify(data));
    
    // Update registry status if needed
    const registry = getGameRegistry();
    const entry = registry.find(r => r.roomCode === data.roomCode);
    if (entry) {
        entry.isEnded = data.isEnded;
        localStorage.setItem(KEY_GAME_REGISTRY, JSON.stringify(registry));
    }
  }
  
  window.dispatchEvent(new Event('storage'));
};

export const getRoomData = (): RoomData | null => {
  const data = localStorage.getItem(KEY_ACTIVE_ROOM);
  return data ? JSON.parse(data) : null;
};

export const getTeamsData = (): Record<number, TeamData> => {
  const data = localStorage.getItem(KEY_ACTIVE_TEAMS);
  return data ? JSON.parse(data) : {};
};

export const updateTeamProgress = (
  teamId: number, 
  updates: Partial<TeamData>
) => {
  const teams = getTeamsData();
  if (teams[teamId]) {
    teams[teamId] = { ...teams[teamId], ...updates };
    
    // 1. Save Active
    const teamsStr = JSON.stringify(teams);
    localStorage.setItem(KEY_ACTIVE_TEAMS, teamsStr);
    
    // 2. Persist Namespaced
    const room = getRoomData();
    if (room?.roomCode) {
       localStorage.setItem(getTeamsKey(room.roomCode), teamsStr);
    }

    window.dispatchEvent(new Event('storage'));
  }
};

export const joinTeam = (teamId: number, userName: string) => {
  const teams = getTeamsData();
  if (teams[teamId]) {
    if (!teams[teamId].members.includes(userName)) {
      teams[teamId].members.push(userName);
      
      const teamsStr = JSON.stringify(teams);
      localStorage.setItem(KEY_ACTIVE_TEAMS, teamsStr);
      
      const room = getRoomData();
      if (room?.roomCode) {
         localStorage.setItem(getTeamsKey(room.roomCode), teamsStr);
      }

      window.dispatchEvent(new Event('storage'));
    }
  }
};

export const clearActiveGameData = () => {
  localStorage.removeItem(KEY_ACTIVE_ROOM);
  localStorage.removeItem(KEY_ACTIVE_TEAMS);
  window.dispatchEvent(new Event('storage'));
};