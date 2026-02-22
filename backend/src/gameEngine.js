const { v4: uuidv4 } = require('uuid');
const { getRoom, rooms } = require('./roomManager');

const GAME_DURATION = 180; // 3 minutes in seconds
const ROPE_WIN_THRESHOLD = 100; // Rope position to win
const ROPE_MOVE_AMOUNT = 10; // How much rope moves per correct answer
const QUESTION_TYPES = ['addition', 'subtraction', 'multiplication', 'division'];

function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeQuestionTypes(questionTypes) {
  if (!Array.isArray(questionTypes)) {
    return QUESTION_TYPES;
  }

  const filtered = [...new Set(
    questionTypes.filter((type) => QUESTION_TYPES.includes(type))
  )];

  return filtered.length > 0 ? filtered : QUESTION_TYPES;
}

/**
 * Generate a random math question
 * @param {Array<string>} questionTypes
 * @returns {Object} Question with id, text, and answer
 */
function generateQuestion(questionTypes) {
  const allowedTypes = normalizeQuestionTypes(questionTypes);
  const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
  
  let text, answer;
  
  switch (type) {
    case 'addition':
      // Kids mode: keep addends and results small (all numbers < 100)
      const a1 = randomIntInclusive(1, 20);
      const b1 = randomIntInclusive(1, 20);
      text = `${a1} + ${b1}`;
      answer = a1 + b1;
      break;
      
    case 'subtraction':
      // Keep subtraction positive and simple
      const b2 = randomIntInclusive(1, 20);
      const difference = randomIntInclusive(0, 20);
      const a2 = b2 + difference;
      text = `${a2} - ${b2}`;
      answer = a2 - b2;
      break;
      
    case 'multiplication':
      // Single-digit multiplication table
      const a3 = randomIntInclusive(2, 9);
      const b3 = randomIntInclusive(2, 9);
      text = `${a3} × ${b3}`;
      answer = a3 * b3;
      break;
      
    case 'division':
      // Whole-number division with question numbers under 100
      const quotient = randomIntInclusive(1, 9);
      const divisor = randomIntInclusive(2, 9);
      const dividend = quotient * divisor;
      text = `${dividend} ÷ ${divisor}`;
      answer = quotient;
      break;
  }
  
  const question = {
    id: uuidv4(),
    text,
    answer,
    type
  };
  
  console.log(`[GameEngine] Generated question: ${text} = ${answer}`);
  return question;
}

/**
 * Initialize a new game for a room
 * @param {string} roomId 
 * @returns {Object|null} The room object or null if not found
 */
function createGame(roomId) {
  const room = getRoom(roomId);
  
  if (!room) {
    console.error(`[GameEngine] Cannot create game: Room ${roomId} not found`);
    return null;
  }
  
  if (room.players.length !== 2) {
    console.error(`[GameEngine] Cannot create game: Room ${roomId} needs 2 players`);
    return null;
  }
  
  // Reset game state
  room.ropePosition = 0;
  room.timerRemaining = GAME_DURATION;
  room.status = 'waiting';
  room.currentQuestion = null;
  
  // Reset player scores
  room.players.forEach(player => {
    player.score = 0;
    player.isReady = false;
  });
  
  console.log(`[GameEngine] Created game for room ${roomId}`);
  return room;
}

/**
 * Start the game
 * @param {string} roomId 
 * @param {function} emitCallback - Function to emit events to clients
 * @returns {boolean} Success
 */
function startGame(roomId, emitCallback) {
  const room = getRoom(roomId);
  
  if (!room) {
    console.error(`[GameEngine] Cannot start game: Room ${roomId} not found`);
    return false;
  }
  
  room.status = 'playing';
  room.currentQuestion = generateQuestion(room.questionTypes);
  
  console.log(`[GameEngine] Game started in room ${roomId}`);
  
  // Start timer
  room.timerInterval = setInterval(() => {
    room.timerRemaining--;
    
    if (emitCallback) {
      emitCallback('timer_update', { timerRemaining: room.timerRemaining });
    }
    
    if (room.timerRemaining <= 0) {
      endGame(roomId, 'time_up', emitCallback);
    }
  }, 1000);
  
  return true;
}

/**
 * End the game and determine winner
 * @param {string} roomId 
 * @param {string} reason - 'time_up', 'rope_threshold', 'player_leave'
 * @param {function} emitCallback - Function to emit events to clients
 * @returns {Object|null} Game result or null
 */
function endGame(roomId, reason, emitCallback) {
  const room = getRoom(roomId);
  
  if (!room) {
    console.error(`[GameEngine] Cannot end game: Room ${roomId} not found`);
    return null;
  }
  
  // Clear timer
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  
  room.status = 'finished';
  
  // Determine winner
  let winner = null;
  let winnerSide = null;
  
  if (room.players.length >= 2) {
    const leftPlayer = room.players.find(p => p.side === 'left');
    const rightPlayer = room.players.find(p => p.side === 'right');
    
    if (reason === 'rope_threshold') {
      // Rope position determines winner
      if (room.ropePosition <= -ROPE_WIN_THRESHOLD) {
        winner = leftPlayer;
        winnerSide = 'left';
      } else if (room.ropePosition >= ROPE_WIN_THRESHOLD) {
        winner = rightPlayer;
        winnerSide = 'right';
      }
    } else if (reason === 'time_up') {
      // Compare scores or rope position
      if (leftPlayer && rightPlayer) {
        if (leftPlayer.score > rightPlayer.score) {
          winner = leftPlayer;
          winnerSide = 'left';
        } else if (rightPlayer.score > leftPlayer.score) {
          winner = rightPlayer;
          winnerSide = 'right';
        }
        // Tie - no winner
      }
    }
  }
  
  const result = {
    roomId,
    reason,
    winner: winner ? { id: winner.id, username: winner.username, side: winnerSide } : null,
    winnerSide,
    ropePosition: room.ropePosition,
    players: room.players.map(p => ({
      id: p.id,
      username: p.username,
      score: p.score,
      side: p.side
    }))
  };
  
  console.log(`[GameEngine] Game ended in room ${roomId}. Reason: ${reason}. Winner: ${winner ? winner.username : 'None'}`);
  
  if (emitCallback) {
    emitCallback('game_over', result);
  }
  
  return result;
}

/**
 * Update rope position based on correct answer
 * @param {string} roomId 
 * @param {string} playerSide - 'left' or 'right'
 * @param {number} amount - Amount to move (default: ROPE_MOVE_AMOUNT)
 * @returns {Object|null} Updated rope position info
 */
function updateRopePosition(roomId, playerSide, amount = ROPE_MOVE_AMOUNT) {
  const room = getRoom(roomId);
  
  if (!room || room.status !== 'playing') {
    return null;
  }
  
  // Move rope toward the player who answered correctly
  // Left player correct → rope moves left (negative)
  // Right player correct → rope moves right (positive)
  if (playerSide === 'left') {
    room.ropePosition -= amount;
  } else {
    room.ropePosition += amount;
  }
  
  // Clamp to valid range
  room.ropePosition = Math.max(-ROPE_WIN_THRESHOLD, Math.min(ROPE_WIN_THRESHOLD, room.ropePosition));
  
  console.log(`[GameEngine] Rope position updated in room ${roomId}: ${room.ropePosition}`);
  
  return {
    ropePosition: room.ropePosition,
    direction: playerSide === 'left' ? 'left' : 'right',
    thresholdReached: Math.abs(room.ropePosition) >= ROPE_WIN_THRESHOLD
  };
}

/**
 * Validate an answer
 * @param {string} roomId 
 * @param {string} questionId 
 * @param {number} answer 
 * @returns {boolean} Whether answer is correct
 */
function validateAnswer(roomId, questionId, answer) {
  const room = getRoom(roomId);
  
  if (!room || !room.currentQuestion) {
    return false;
  }
  
  if (room.currentQuestion.id !== questionId) {
    return false;
  }
  
  return room.currentQuestion.answer === answer;
}

/**
 * Handle a correct answer from a player
 * @param {string} roomId 
 * @param {string} playerId 
 * @param {function} emitCallback - Function to emit events
 * @returns {Object|null} Result with rope update and new question
 */
function handleCorrectAnswer(roomId, playerId, emitCallback) {
  const room = getRoom(roomId);
  
  if (!room || room.status !== 'playing') {
    return null;
  }
  
  const player = room.players.find(p => p.id === playerId);
  
  if (!player) {
    return null;
  }
  
  // Update score
  player.score++;
  
  // Update rope position
  const ropeUpdate = updateRopePosition(roomId, player.side);
  
  // Generate new question
  room.currentQuestion = generateQuestion(room.questionTypes);
  
  const result = {
    playerId,
    playerSide: player.side,
    playerScore: player.score,
    ropePosition: ropeUpdate.ropePosition,
    direction: ropeUpdate.direction,
    newQuestion: room.currentQuestion,
    gameEnded: ropeUpdate.thresholdReached
  };
  
  console.log(`[GameEngine] Player ${player.username} answered correctly in room ${roomId}`);
  
  if (emitCallback) {
    emitCallback('answer_result', {
      correct: true,
      playerId,
      playerSide: player.side,
      playerScore: player.score
    });
    
    // Emit rope animation event
    const animationEvent = player.side === 'left' ? 'move_left' : 'move_right';
    emitCallback('rope_animation_event', {
      event: animationEvent,
      ropePosition: ropeUpdate.ropePosition,
      playerSide: player.side
    });
    
    // Emit new question
    emitCallback('new_question', {
      question: room.currentQuestion
    });
  }
  
  // Check for win condition
  if (ropeUpdate.thresholdReached) {
    endGame(roomId, 'rope_threshold', emitCallback);
  }
  
  return result;
}

/**
 * Handle an incorrect answer
 * @param {string} roomId 
 * @param {string} playerId 
 * @param {function} emitCallback 
 * @returns {Object} Result
 */
function handleIncorrectAnswer(roomId, playerId, emitCallback) {
  const room = getRoom(roomId);
  
  if (!room) {
    return null;
  }
  
  const player = room.players.find(p => p.id === playerId);
  
  console.log(`[GameEngine] Player ${player ? player.username : 'unknown'} answered incorrectly in room ${roomId}`);
  
  if (emitCallback) {
    emitCallback('answer_result', {
      correct: false,
      playerId,
      playerSide: player ? player.side : null,
      playerScore: player ? player.score : 0
    });
  }
  
  return {
    correct: false,
    playerId
  };
}

/**
 * Get current game state for a room
 * @param {string} roomId 
 * @returns {Object|null} Game state
 */
function getGameState(roomId) {
  const room = getRoom(roomId);
  
  if (!room) {
    return null;
  }
  
  return {
    roomId: room.roomId,
    players: room.players.map(p => ({
      id: p.id,
      username: p.username,
      score: p.score,
      connected: p.connected,
      isReady: p.isReady,
      side: p.side
    })),
    ropePosition: room.ropePosition,
    currentQuestion: room.currentQuestion,
    timerRemaining: room.timerRemaining,
    status: room.status,
    questionTypes: normalizeQuestionTypes(room.questionTypes)
  };
}

module.exports = {
  GAME_DURATION,
  ROPE_WIN_THRESHOLD,
  ROPE_MOVE_AMOUNT,
  generateQuestion,
  createGame,
  startGame,
  endGame,
  updateRopePosition,
  validateAnswer,
  handleCorrectAnswer,
  handleIncorrectAnswer,
  getGameState
};
