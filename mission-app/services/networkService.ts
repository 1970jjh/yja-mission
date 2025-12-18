import Peer from 'peerjs';
import { getRoomData, getTeamsData } from './storageService';
import { RoomData, TeamData } from '../types';

let peer: Peer | null = null;
let connMap: Map<string, any> = new Map(); // For Host: list of client connections
let hostConn: any = null; // For Client: connection to host
let isHost = false;

// Helpers to update local storage directly to trigger events
const updateLocalStorage = (room: RoomData, teams: Record<number, TeamData>) => {
    localStorage.setItem('imf_room_data', JSON.stringify(room));
    localStorage.setItem('imf_teams_data', JSON.stringify(teams));
    window.dispatchEvent(new Event('storage'));
};

const updateTeamsStorage = (teams: Record<number, TeamData>) => {
    localStorage.setItem('imf_teams_data', JSON.stringify(teams));
    window.dispatchEvent(new Event('storage'));
};

// --- Host (Admin) Logic ---

export const initializeHost = (roomCode: string) => {
    if (peer) return; // Already initialized
    isHost = true;
    // We prefix to avoid collisions with other peerjs users
    const peerId = `imf-mission-${roomCode}`;
    
    console.log("Initializing Host with ID:", peerId);
    
    peer = new Peer(peerId, {
        debug: 1
    });
    
    peer.on('open', (id) => {
        console.log('Host initialized:', id);
    });

    peer.on('connection', (conn) => {
        console.log('Client connected:', conn.peer);
        connMap.set(conn.peer, conn);
        
        conn.on('data', (data: any) => {
            handleDataFromClient(data);
        });
        
        conn.on('close', () => connMap.delete(conn.peer));

        // Send initial state immediately upon connection
        conn.on('open', () => {
             const room = getRoomData();
             const teams = getTeamsData();
             if (room) {
                 conn.send({ type: 'SYNC_FULL', room, teams });
             }
        });
    });

    peer.on('error', (err) => {
        console.error("PeerJS Error:", err);
    });
};

// --- Client (User) Logic ---

export const joinRoom = (roomCode: string, onConnected: () => void, onFailed: () => void) => {
    if (peer) peer.destroy(); // Reset if retrying
    isHost = false;
    peer = new Peer(); // Random ID for client

    peer.on('open', () => {
        const targetId = `imf-mission-${roomCode}`;
        console.log("Attempting to connect to:", targetId);
        const conn = peer.connect(targetId);
        
        conn.on('open', () => {
            console.log("Connected to Host");
            hostConn = conn;
            onConnected();
        });

        conn.on('data', (data: any) => {
            handleDataFromHost(data);
        });

        conn.on('error', (err) => {
            console.error("Connection Error:", err);
            onFailed();
        });
        
        conn.on('close', () => {
             console.log("Connection closed");
             // Optional: Handle disconnect UI
        });
    });
    
    peer.on('error', (err) => {
        console.error("Peer Error:", err);
        onFailed();
    });
};

// --- Data Handling ---

const handleDataFromClient = (data: any) => {
    // Client sends actions like "JOIN_REQUEST" or "UPDATE_TEAM"
    if (data.type === 'UPDATE_TEAM') {
        const { teamId, updates } = data.payload;
        const teams = getTeamsData();
        if (teams[teamId]) {
            teams[teamId] = { ...teams[teamId], ...updates };
            // Save to storage locally
            updateTeamsStorage(teams);
            // Broadcast new state to everyone (including the sender, to confirm)
            broadcastState();
        }
    }
    
    if (data.type === 'JOIN_REQUEST') {
        const { teamId, name } = data.payload;
        const teams = getTeamsData();
        // Allow same name to rejoin (for reconnection support)
        if (teams[teamId]) {
             if (!teams[teamId].members.includes(name)) {
                 teams[teamId].members.push(name);
             }
             updateTeamsStorage(teams);
             broadcastState();
        }
    }
};

const handleDataFromHost = (data: any) => {
    if (data.type === 'SYNC_FULL') {
        const { room, teams } = data;
        updateLocalStorage(room, teams);
    }
};

// --- Public Methods ---

export const broadcastState = () => {
    if (!isHost) return;
    const room = getRoomData();
    const teams = getTeamsData();
    // Only broadcast if we have data
    if (!room) return;

    const payload = { type: 'SYNC_FULL', room, teams };
    
    connMap.forEach(conn => {
        if (conn.open) conn.send(payload);
    });
};

export const sendClientAction = (actionType: string, payload: any) => {
    if (hostConn && hostConn.open) {
        hostConn.send({ type: actionType, payload });
    }
};

export const disconnect = () => {
    if (peer) {
        peer.destroy();
        peer = null;
    }
    connMap.clear();
    hostConn = null;
};