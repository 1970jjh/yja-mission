import { RoomSummary } from '../types';

// API endpoint for room discovery
const API_BASE = '/api/rooms';

// --- Room Registry Functions using Vercel Serverless API ---

export const publishRoomToFirebase = async (room: RoomSummary): Promise<void> => {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room)
    });

    if (response.ok) {
      console.log('Room published to server:', room.roomCode);
    } else {
      console.warn('Failed to publish room to server');
    }
  } catch (error) {
    console.error('Error publishing room:', error);
  }
};

export const removeRoomFromFirebase = async (roomCode: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}?code=${roomCode}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      console.log('Room removed from server:', roomCode);
    }
  } catch (error) {
    console.error('Error removing room:', error);
  }
};

export const updateRoomStatusInFirebase = async (roomCode: string, isEnded: boolean): Promise<void> => {
  try {
    // Fetch current room data and update
    const response = await fetch(API_BASE);
    const data = await response.json();
    const rooms = data.rooms || [];
    const room = rooms.find((r: RoomSummary) => r.roomCode === roomCode);

    if (room) {
      room.isEnded = isEnded;
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });
      console.log('Room status updated:', roomCode, isEnded);
    }
  } catch (error) {
    console.error('Error updating room status:', error);
  }
};

// Polling interval for room updates (in milliseconds)
const POLL_INTERVAL = 3000;

export const subscribeToRooms = (callback: (rooms: RoomSummary[]) => void): (() => void) => {
  let isActive = true;

  const fetchRooms = async () => {
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();

      if (isActive) {
        const rooms = data.rooms || [];
        // Sort: active first, then by createdAt descending
        rooms.sort((a: RoomSummary, b: RoomSummary) => {
          if (a.isEnded && !b.isEnded) return 1;
          if (!a.isEnded && b.isEnded) return -1;
          return b.createdAt - a.createdAt;
        });
        callback(rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      if (isActive) {
        callback([]);
      }
    }
  };

  // Initial fetch
  fetchRooms();

  // Poll for updates
  const intervalId = setInterval(fetchRooms, POLL_INTERVAL);

  // Return unsubscribe function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
};

// Fetch rooms once (for initial load)
export const fetchRoomsOnce = async (): Promise<RoomSummary[]> => {
  try {
    const response = await fetch(API_BASE);
    const data = await response.json();
    const rooms = data.rooms || [];

    rooms.sort((a: RoomSummary, b: RoomSummary) => {
      if (a.isEnded && !b.isEnded) return 1;
      if (!a.isEnded && b.isEnded) return -1;
      return b.createdAt - a.createdAt;
    });

    return rooms;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
};
