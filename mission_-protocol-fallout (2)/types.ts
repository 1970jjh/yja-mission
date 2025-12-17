export enum Stage {
  INTRO = 'INTRO',
  MAP = 'MAP',
  PUZZLE_VIEW = 'PUZZLE_VIEW',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  // New Stages for Flow
  LOGIN_SELECT = 'LOGIN_SELECT', // Choose Admin or User
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  USER_JOIN = 'USER_JOIN',
  WAITING_ROOM = 'WAITING_ROOM',
}

export enum LocationId {
  BLUE_HOUSE = 'blue_house',
  SAN_FRANCISCO = 'san_francisco',
  FRANCE = 'france',
  INCHEON_AIRPORT = 'incheon_airport',
}

export interface SubPuzzle {
  id: string;
  title: string;
  imageUrl: string;
  answer: string;
  solved?: boolean;
  relatedLink?: {
    title: string;
    url: string;
  };
}

export interface PuzzleData {
  id: LocationId;
  title: string;
  coordinates?: string;
  description: string;
  backgroundImage?: string;
  problemImage?: string; 
  externalLink?: string; 
  videoLinks?: string[]; 
  subPuzzles?: SubPuzzle[];
  finalStage?: {
    description: string;
    imageUrl: string;
    answer: string;
    placeholder?: string;
  };
  question: string;
  answer: string; 
  nextLocationId?: LocationId; 
  hintContext: string; 
  isBomb?: boolean; 
}

// Data structures for Multi-Team logic
export interface TeamData {
  teamId: number; // 1 to 20
  name: string; // "1조", "2조" etc.
  members: string[]; // List of user names
  currentLocationId: LocationId | null;
  unlockedLocations: LocationId[];
  completedLocations: LocationId[];
  solvedSubPuzzles: string[]; // Track individual codes like 'codeA-1'
  completionTimes: Record<string, number>; // Timestamp per location
  finishTime: number | null; // Null if not finished
  hintCount: number;
  isDead: boolean;
}

export interface RoomData {
  orgName: string;
  totalTeams: number;
  isStarted: boolean;
  startTime: number | null;
  isEnded: boolean;
  roomCode: string; // Random generated code for P2P connection
}

export interface RoomSummary {
  roomCode: string;
  orgName: string;
  createdAt: number;
  isEnded: boolean;
}

export interface GameState {
  stage: Stage;
  // Local User State
  myTeamId: number | null;
  myName: string | null;
  currentLocationId: LocationId | null;
  // Global Synced State (loaded from storage)
  room: RoomData | null;
  teams: Record<number, TeamData>;
}