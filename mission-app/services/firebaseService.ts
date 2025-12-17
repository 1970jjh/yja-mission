import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  push,
  off,
  DataSnapshot
} from 'firebase/database';
import { RoomData, TeamData, LocationId } from '../types';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCvSBA0Geh6jFVQ8pR7orcOzBSh5KkLW0w",
  authDomain: "yja-mission.firebaseapp.com",
  databaseURL: "https://yja-mission-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "yja-mission",
  storageBucket: "yja-mission.firebasestorage.app",
  messagingSenderId: "835544658974",
  appId: "1:835544658974:web:85e1362e498c14a22aea0f"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ============================================
// 방(Room) 관련 함수들
// ============================================

// 새 방 생성
export const createRoom = async (orgName: string, totalTeams: number): Promise<string> => {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newRoom: RoomData = {
    orgName,
    totalTeams,
    isStarted: false,
    startTime: null,
    isEnded: false,
    roomCode
  };

  // 팀 데이터 초기화
  const teams: Record<number, TeamData> = {};
  for (let i = 1; i <= totalTeams; i++) {
    teams[i] = {
      teamId: i,
      name: `${i}조`,
      members: [],
      currentLocationId: null,
      unlockedLocations: [LocationId.BLUE_HOUSE],
      completedLocations: [],
      solvedSubPuzzles: [],
      completionTimes: {},
      finishTime: null,
      hintCount: 0,
      isDead: false,
    };
  }

  // Firebase에 저장
  await set(ref(db, `rooms/${roomCode}`), newRoom);
  await set(ref(db, `teams/${roomCode}`), teams);

  return roomCode;
};

// 방 정보 가져오기
export const getRoom = async (roomCode: string): Promise<RoomData | null> => {
  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  return snapshot.exists() ? snapshot.val() : null;
};

// 방 정보 업데이트
export const updateRoom = async (roomCode: string, updates: Partial<RoomData>): Promise<void> => {
  await update(ref(db, `rooms/${roomCode}`), updates);
};

// 방 삭제
export const deleteRoom = async (roomCode: string): Promise<void> => {
  await remove(ref(db, `rooms/${roomCode}`));
  await remove(ref(db, `teams/${roomCode}`));
};

// 방 목록 가져오기 (관리자용)
export const getAllRooms = async (): Promise<RoomData[]> => {
  const snapshot = await get(ref(db, 'rooms'));
  if (!snapshot.exists()) return [];

  const rooms = snapshot.val();
  return Object.values(rooms);
};

// ============================================
// 팀(Team) 관련 함수들
// ============================================

// 팀 정보 가져오기
export const getTeams = async (roomCode: string): Promise<Record<number, TeamData>> => {
  const snapshot = await get(ref(db, `teams/${roomCode}`));
  return snapshot.exists() ? snapshot.val() : {};
};

// 팀 정보 업데이트
export const updateTeam = async (
  roomCode: string,
  teamId: number,
  updates: Partial<TeamData>
): Promise<void> => {
  await update(ref(db, `teams/${roomCode}/${teamId}`), updates);
};

// 팀에 멤버 추가
export const joinTeam = async (
  roomCode: string,
  teamId: number,
  userName: string
): Promise<void> => {
  const snapshot = await get(ref(db, `teams/${roomCode}/${teamId}/members`));
  const members: string[] = snapshot.exists() ? snapshot.val() : [];

  if (!members.includes(userName)) {
    members.push(userName);
    await set(ref(db, `teams/${roomCode}/${teamId}/members`), members);
  }
};

// ============================================
// 실시간 구독 함수들
// ============================================

// 방 정보 실시간 구독
export const subscribeToRoom = (
  roomCode: string,
  callback: (room: RoomData | null) => void
): (() => void) => {
  const roomRef = ref(db, `rooms/${roomCode}`);

  const unsubscribe = onValue(roomRef, (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  // 구독 해제 함수 반환
  return () => off(roomRef);
};

// 팀 정보 실시간 구독
export const subscribeToTeams = (
  roomCode: string,
  callback: (teams: Record<number, TeamData>) => void
): (() => void) => {
  const teamsRef = ref(db, `teams/${roomCode}`);

  const unsubscribe = onValue(teamsRef, (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });

  // 구독 해제 함수 반환
  return () => off(teamsRef);
};

// 모든 방 실시간 구독 (관리자 로비용)
export const subscribeToAllRooms = (
  callback: (rooms: RoomData[]) => void
): (() => void) => {
  const roomsRef = ref(db, 'rooms');

  const unsubscribe = onValue(roomsRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const rooms = snapshot.val();
    callback(Object.values(rooms));
  });

  return () => off(roomsRef);
};

// ============================================
// 게임 액션 함수들
// ============================================

// 게임 시작
export const startGame = async (roomCode: string): Promise<void> => {
  await update(ref(db, `rooms/${roomCode}`), {
    isStarted: true,
    startTime: Date.now()
  });
};

// 게임 종료
export const endGame = async (roomCode: string): Promise<void> => {
  await update(ref(db, `rooms/${roomCode}`), {
    isEnded: true
  });
};

// 서브퍼즐 해결
export const solveSubPuzzle = async (
  roomCode: string,
  teamId: number,
  subPuzzleId: string
): Promise<void> => {
  const snapshot = await get(ref(db, `teams/${roomCode}/${teamId}/solvedSubPuzzles`));
  const solved: string[] = snapshot.exists() ? snapshot.val() : [];

  if (!solved.includes(subPuzzleId)) {
    solved.push(subPuzzleId);
    await set(ref(db, `teams/${roomCode}/${teamId}/solvedSubPuzzles`), solved);
  }
};

// 스테이지 완료
export const completeStage = async (
  roomCode: string,
  teamId: number,
  locationId: LocationId,
  nextLocationId: LocationId | null
): Promise<boolean> => {
  const snapshot = await get(ref(db, `teams/${roomCode}/${teamId}`));
  if (!snapshot.exists()) return false;

  const team: TeamData = snapshot.val();
  const newCompleted = [...(team.completedLocations || []), locationId];
  const newUnlocked = [...(team.unlockedLocations || [])];
  const newCompletionTimes = { ...(team.completionTimes || {}), [locationId]: Date.now() };

  let isFinished = false;

  if (nextLocationId) {
    if (!newUnlocked.includes(nextLocationId)) {
      newUnlocked.push(nextLocationId);
    }
  } else {
    isFinished = true;
  }

  const updates: Partial<TeamData> = {
    completedLocations: newCompleted,
    unlockedLocations: newUnlocked,
    completionTimes: newCompletionTimes,
    currentLocationId: null
  };

  if (isFinished) {
    updates.finishTime = Date.now();
  }

  await update(ref(db, `teams/${roomCode}/${teamId}`), updates);

  return isFinished;
};

// 힌트 사용
export const useHint = async (roomCode: string, teamId: number): Promise<void> => {
  const snapshot = await get(ref(db, `teams/${roomCode}/${teamId}/hintCount`));
  const currentCount = snapshot.exists() ? snapshot.val() : 0;
  await set(ref(db, `teams/${roomCode}/${teamId}/hintCount`), currentCount + 1);
};

export { db };
