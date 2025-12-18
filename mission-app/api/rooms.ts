import { Redis } from '@upstash/redis';

// Initialize Redis client
// For production, set these environment variables in Vercel:
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// Get free Redis at: https://upstash.com (no credit card needed)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ROOMS_KEY = 'imf:rooms';
const ROOM_TTL = 60 * 60 * 24; // 24 hours

interface RoomSummary {
  roomCode: string;
  orgName: string;
  createdAt: number;
  isEnded: boolean;
}

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Check if Redis is configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Response(
      JSON.stringify({
        error: 'Redis not configured',
        rooms: [],
        message: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel environment variables'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);

    // GET /api/rooms - List all rooms
    if (request.method === 'GET') {
      const rooms = await redis.hgetall<Record<string, RoomSummary>>(ROOMS_KEY) || {};
      const roomList = Object.values(rooms).sort((a, b) => {
        if (a.isEnded && !b.isEnded) return 1;
        if (!a.isEnded && b.isEnded) return -1;
        return b.createdAt - a.createdAt;
      });

      return new Response(
        JSON.stringify({ rooms: roomList }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/rooms - Create/update a room
    if (request.method === 'POST') {
      const body = await request.json() as RoomSummary;

      if (!body.roomCode || !body.orgName) {
        return new Response(
          JSON.stringify({ error: 'roomCode and orgName are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await redis.hset(ROOMS_KEY, { [body.roomCode]: body });
      await redis.expire(ROOMS_KEY, ROOM_TTL);

      return new Response(
        JSON.stringify({ success: true, room: body }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /api/rooms?code=XXX - Delete a room
    if (request.method === 'DELETE') {
      const roomCode = url.searchParams.get('code');

      if (!roomCode) {
        return new Response(
          JSON.stringify({ error: 'code parameter is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await redis.hdel(ROOMS_KEY, roomCode);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', rooms: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
