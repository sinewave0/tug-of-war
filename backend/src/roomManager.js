const { v4: uuidv4 } = require('uuid');

// In-memory room storage
const rooms = new Map();
const AVAILABLE_QUESTION_TYPES = ['addition', 'subtraction', 'multiplication', 'division'];

function normalizeQuestionTypes(questionTypes) {
  if (!Array.isArray(questionTypes)) {
    return [...AVAILABLE_QUESTION_TYPES];
  }

  const normalized = [...new Set(
    questionTypes.filter((type) => AVAILABLE_QUESTION_TYPES.includes(type))
  )];

  return normalized.length > 0 ? normalized : [...AVAILABLE_QUESTION_TYPES];
}

/**
 * Generate a unique 6-character room ID
 */
function generateRoomId() {
  let roomId = uuidv4().substring(0, 6).toUpperCase();
  while (rooms.has(roomId)) {
    roomId = uuidv4().substring(0, 6).toUpperCase();
  }
  return roomId;
}

/**
 * Create a new room
 * @param {Object} options
 * @param {Array<string>} options.questionTypes
 * @returns {string} The new room ID
 */
function createRoom(options = {}) {
  const roomId = generateRoomId();
  
  const room = {
    roomId,
    players: [],
    ropePosition: 0, // -100 to 100 (negative = left winning, positive = right winning)
    currentQuestion: null,
    timerRemaining: 180, // 3 minutes
    status: 'waiting', // 'waiting' | 'playing' | 'finished'
    timerInterval: null,
    countdownInterval: null,
    questionTypes: normalizeQuestionTypes(options.questionTypes),
    createdAt: Date.now()
  };
  
  rooms.set(roomId, room);
  console.log(`[RoomManager] Created room: ${roomId}`);
  return roomId;
}

/**
 * Get a room by ID
 * @param {string} roomId 
 * @returns {Object|null} Room object or null
 */
function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Check if room exists
 * @param {string} roomId 
 * @returns {boolean}
 */
function roomExists(roomId) {
  return rooms.has(roomId);
}

/**
 * Add a player to a room
 * @param {string} roomId 
 * @param {Object} player - { id, username, socketId }
 * @returns {Object} Result with success boolean and message
 */
function joinRoom(roomId, player) {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, message: 'Room not found' };
  }
  
  if (room.status === 'finished') {
    return { success: false, message: 'Game has already ended' };
  }
  
  if (room.players.length >= 2) {
    // Check if player is reconnecting
    const existingPlayer = room.players.find(p => p.id === player.id);
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.socketId = player.socketId;
      console.log(`[RoomManager] Player ${player.username} reconnected to room ${roomId}`);
      return { success: true, message: 'Reconnected', room, isReconnect: true };
    }
    return { success: false, message: 'Room is full' };
  }
  
  // Check if player already in room (reconnect scenario)
  const existingIndex = room.players.findIndex(p => p.id === player.id);
  if (existingIndex !== -1) {
    room.players[existingIndex].connected = true;
    room.players[existingIndex].socketId = player.socketId;
    console.log(`[RoomManager] Player ${player.username} reconnected to room ${roomId}`);
    return { success: true, message: 'Reconnected', room, isReconnect: true };
  }
  
  // Assign side (first player = left, second = right)
  const side = room.players.length === 0 ? 'left' : 'right';
  
  const newPlayer = {
    id: player.id,
    username: player.username.substring(0, 10), // Max 10 chars
    score: 0,
    connected: true,
    isReady: false,
    side,
    socketId: player.socketId
  };
  
  room.players.push(newPlayer);
  console.log(`[RoomManager] Player ${player.username} joined room ${roomId} as ${side}`);
  
  return { success: true, message: 'Joined room', room, isReconnect: false };
}

/**
 * Remove a player from a room
 * @param {string} roomId 
 * @param {string} playerId 
 * @returns {Object} Result with success boolean
 */
function leaveRoom(roomId, playerId) {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, message: 'Room not found' };
  }
  
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  
  if (playerIndex === -1) {
    return { success: false, message: 'Player not in room' };
  }
  
  const player = room.players[playerIndex];
  
  // Mark as disconnected rather than removing immediately (allow reconnection)
  player.connected = false;
  
  console.log(`[RoomManager] Player ${player.username} left room ${roomId}`);
  
  // If game hasn't started or is finished, actually remove the player
  if (room.status === 'waiting' || room.status === 'finished') {
    room.players.splice(playerIndex, 1);
  }
  
  // Clean up empty rooms after a delay
  if (room.players.length === 0 || room.players.every(p => !p.connected)) {
    setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (currentRoom && (currentRoom.players.length === 0 || currentRoom.players.every(p => !p.connected))) {
        if (currentRoom.timerInterval) {
          clearInterval(currentRoom.timerInterval);
        }
        if (currentRoom.countdownInterval) {
          clearInterval(currentRoom.countdownInterval);
        }
        rooms.delete(roomId);
        console.log(`[RoomManager] Deleted empty room: ${roomId}`);
      }
    }, 30000); // 30 second grace period
  }
  
  return { success: true, message: 'Left room', player };
}

/**
 * Mark a player as ready
 * @param {string} roomId 
 * @param {string} playerId 
 * @returns {Object} Result with success boolean and bothReady flag
 */
function setPlayerReady(roomId, playerId) {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, message: 'Room not found' };
  }
  
  const player = room.players.find(p => p.id === playerId);
  
  if (!player) {
    return { success: false, message: 'Player not in room' };
  }
  
  player.isReady = true;
  console.log(`[RoomManager] Player ${player.username} is ready in room ${roomId}`);
  
  const bothReady = room.players.length === 2 && room.players.every(p => p.isReady);
  
  return { success: true, bothReady, room };
}

/**
 * Get all rooms (for debugging)
 * @returns {Array}
 */
function getAllRooms() {
  return Array.from(rooms.values());
}

/**
 * Clean up old rooms (call periodically)
 */
function cleanupOldRooms() {
  const now = Date.now();
  const MAX_AGE = 60 * 60 * 1000; // 1 hour
  
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > MAX_AGE) {
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
      }
      if (room.countdownInterval) {
        clearInterval(room.countdownInterval);
      }
      rooms.delete(roomId);
      console.log(`[RoomManager] Cleaned up old room: ${roomId}`);
    }
  }
}

// Run cleanup every 10 minutes
const cleanupInterval = setInterval(cleanupOldRooms, 10 * 60 * 1000);
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

module.exports = {
  createRoom,
  getRoom,
  roomExists,
  joinRoom,
  leaveRoom,
  setPlayerReady,
  getAllRooms,
  rooms // Export for direct access if needed
};
