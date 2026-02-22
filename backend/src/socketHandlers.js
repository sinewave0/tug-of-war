const { 
  createRoom, 
  getRoom, 
  roomExists, 
  joinRoom, 
  leaveRoom, 
  setPlayerReady,
  rooms 
} = require('./roomManager');

const {
  generateQuestion,
  createGame,
  startGame,
  endGame,
  validateAnswer,
  handleCorrectAnswer,
  handleIncorrectAnswer,
  getGameState,
  GAME_DURATION
} = require('./gameEngine');

/**
 * Setup all socket event handlers
 * @param {Server} io - Socket.io server instance
 */
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Store player info on socket for disconnect handling
    socket.playerInfo = null;
    socket.currentRoom = null;
    
    /**
     * Create a new room
     * Payload: { playerId, username, questionTypes? }
     */
    socket.on('create_room', (data) => {
      try {
        const { playerId, username, questionTypes } = data;
        
        if (!playerId || !username) {
          socket.emit('error', { message: 'Missing playerId or username' });
          return;
        }
        
        const roomId = createRoom({ questionTypes });
        
        const result = joinRoom(roomId, {
          id: playerId,
          username,
          socketId: socket.id
        });
        
        if (result.success) {
          socket.join(roomId);
          socket.playerInfo = { id: playerId, username };
          socket.currentRoom = roomId;
          
          socket.emit('room_created', {
            roomId,
            player: result.room.players.find(p => p.id === playerId),
            gameState: getGameState(roomId)
          });
          
          console.log(`[Socket] Room ${roomId} created by ${username}`);
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        console.error('[Socket] Error in create_room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });
    
    /**
     * Join an existing room
     * Payload: { roomId, playerId, username }
     */
    socket.on('join_room', (data) => {
      try {
        const { roomId, playerId, username } = data;
        
        if (!roomId || !playerId || !username) {
          socket.emit('error', { message: 'Missing roomId, playerId, or username' });
          return;
        }
        
        if (!roomExists(roomId)) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        const result = joinRoom(roomId, {
          id: playerId,
          username,
          socketId: socket.id
        });
        
        if (result.success) {
          socket.join(roomId);
          socket.playerInfo = { id: playerId, username };
          socket.currentRoom = roomId;
          
          // Notify the joining player
          socket.emit('room_joined', {
            roomId,
            player: result.room.players.find(p => p.id === playerId),
            gameState: getGameState(roomId),
            isReconnect: result.isReconnect
          });
          
          // Notify other players in the room
          socket.to(roomId).emit('player_joined', {
            player: result.room.players.find(p => p.id === playerId),
            gameState: getGameState(roomId)
          });
          
          console.log(`[Socket] Player ${username} joined room ${roomId}${result.isReconnect ? ' (reconnect)' : ''}`);
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        console.error('[Socket] Error in join_room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });
    
    /**
     * Player ready signal
     * Payload: { roomId, playerId }
     */
    socket.on('player_ready', (data) => {
      try {
        const { roomId, playerId } = data;
        
        if (!roomId || !playerId) {
          socket.emit('error', { message: 'Missing roomId or playerId' });
          return;
        }
        
        const result = setPlayerReady(roomId, playerId);
        
        if (result.success) {
          // Notify all players in room about ready status
          io.to(roomId).emit('player_ready_update', {
            playerId,
            ready: true,
            bothReady: result.bothReady
          });
          
          console.log(`[Socket] Player ${playerId} ready in room ${roomId}`);
          
          // If both players ready, start countdown
          if (result.bothReady) {
            const room = getRoom(roomId);
            if (!room || room.status !== 'waiting' || room.countdownInterval) {
              return;
            }
            let countdown = 3;
            
            room.countdownInterval = setInterval(() => {
              io.to(roomId).emit('game_start_countdown', { countdown });
              countdown--;
              
              if (countdown < 0) {
                clearInterval(room.countdownInterval);
                room.countdownInterval = null;
                
                // Initialize and start game
                const created = createGame(roomId);
                if (!created) {
                  io.to(roomId).emit('error', { message: 'Failed to initialize game' });
                  return;
                }
                
                const emitToRoom = (event, data) => {
                  io.to(roomId).emit(event, data);
                };
                
                const started = startGame(roomId, emitToRoom);
                if (!started) {
                  io.to(roomId).emit('error', { message: 'Failed to start game' });
                  return;
                }
                
                const activeRoom = getRoom(roomId);
                
                // Emit game start with initial question
                io.to(roomId).emit('game_start', {
                  gameState: getGameState(roomId),
                  question: activeRoom.currentQuestion,
                  timerRemaining: GAME_DURATION
                });
                
                console.log(`[Socket] Game started in room ${roomId}`);
              }
            }, 1000);
          }
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        console.error('[Socket] Error in player_ready:', error);
        socket.emit('error', { message: 'Failed to set ready status' });
      }
    });
    
    /**
     * Submit answer
     * Payload: { roomId, playerId, questionId, answer }
     */
    socket.on('submit_answer', (data) => {
      try {
        const { roomId, playerId, questionId, answer } = data;
        
        if (!roomId || !playerId || !questionId || answer === undefined) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }
        
        const room = getRoom(roomId);
        
        if (!room || room.status !== 'playing') {
          socket.emit('error', { message: 'Game is not in progress' });
          return;
        }
        
        // Check if this question is still active
        if (!room.currentQuestion || room.currentQuestion.id !== questionId) {
          // Question already answered by someone else
          socket.emit('answer_result', {
            correct: false,
            reason: 'too_late',
            message: 'Too slow! Another player answered first.'
          });
          return;
        }
        
        const numericAnswer = Number(answer);
        if (!Number.isFinite(numericAnswer)) {
          socket.emit('answer_result', {
            correct: false,
            playerId,
            message: 'Answer must be a valid number.'
          });
          return;
        }

        const activeQuestionId = questionId || room.currentQuestion.id;
        const isCorrect = validateAnswer(roomId, activeQuestionId, numericAnswer);
        
        const emitToRoom = (event, data) => {
          io.to(roomId).emit(event, data);
        };
        
        if (isCorrect) {
          handleCorrectAnswer(roomId, playerId, emitToRoom);
        } else {
          handleIncorrectAnswer(roomId, playerId, emitToRoom);
          
          // Also notify the submitting player specifically
          socket.emit('answer_result', {
            correct: false,
            playerId,
            message: 'Incorrect answer. Try again!'
          });
        }
      } catch (error) {
        console.error('[Socket] Error in submit_answer:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });
    
    /**
     * Leave game / room
     * Payload: { roomId, playerId }
     */
    socket.on('leave_game', (data) => {
      try {
        const { roomId, playerId } = data;
        
        if (!roomId || !playerId) {
          socket.emit('error', { message: 'Missing roomId or playerId' });
          return;
        }
        
        const room = getRoom(roomId);
        if (room && room.countdownInterval) {
          clearInterval(room.countdownInterval);
          room.countdownInterval = null;
        }
        
        if (room && room.status === 'playing') {
          // End game if someone leaves during active game
          const emitToRoom = (event, data) => {
            io.to(roomId).emit(event, data);
          };
          
          endGame(roomId, 'player_leave', emitToRoom);
        }
        
        const result = leaveRoom(roomId, playerId);
        
        if (result.success) {
          socket.leave(roomId);
          
          // Notify other players
          socket.to(roomId).emit('player_left', {
            playerId,
            username: result.player ? result.player.username : null,
            gameState: getGameState(roomId)
          });
          
          // Redirect all players to home
          io.to(roomId).emit('redirect_home', {
            reason: 'player_left',
            message: `${result.player ? result.player.username : 'A player'} left the game`
          });
          
          socket.playerInfo = null;
          socket.currentRoom = null;
          
          console.log(`[Socket] Player ${playerId} left room ${roomId}`);
        }
        
        socket.emit('left_room', { success: true });
      } catch (error) {
        console.error('[Socket] Error in leave_game:', error);
        socket.emit('error', { message: 'Failed to leave game' });
      }
    });
    
    /**
     * Reconnect to an existing game
     * Payload: { roomId, playerId }
     */
    socket.on('reconnect_player', (data) => {
      try {
        const { roomId, playerId } = data;
        
        if (!roomId || !playerId) {
          socket.emit('error', { message: 'Missing roomId or playerId' });
          return;
        }
        
        const room = getRoom(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Room not found or expired' });
          return;
        }
        
        const player = room.players.find(p => p.id === playerId);
        
        if (!player) {
          socket.emit('error', { message: 'Player not found in room' });
          return;
        }
        
        // Update player connection
        player.connected = true;
        player.socketId = socket.id;
        
        socket.join(roomId);
        socket.playerInfo = { id: playerId, username: player.username };
        socket.currentRoom = roomId;
        
        socket.emit('reconnect_success', {
          roomId,
          player,
          gameState: getGameState(roomId)
        });
        
        // Notify other players
        socket.to(roomId).emit('player_reconnected', {
          playerId,
          username: player.username
        });
        
        console.log(`[Socket] Player ${player.username} reconnected to room ${roomId}`);
      } catch (error) {
        console.error('[Socket] Error in reconnect_player:', error);
        socket.emit('error', { message: 'Failed to reconnect' });
      }
    });
    
    /**
     * Handle disconnect
     */
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
      
      if (socket.currentRoom && socket.playerInfo) {
        const room = getRoom(socket.currentRoom);
        
        if (room) {
          if (room.countdownInterval) {
            clearInterval(room.countdownInterval);
            room.countdownInterval = null;
          }
          const player = room.players.find(p => p.id === socket.playerInfo.id);
          
          if (player) {
            player.connected = false;
            
            // Notify other players
            socket.to(socket.currentRoom).emit('player_disconnected', {
              playerId: socket.playerInfo.id,
              username: socket.playerInfo.username,
              gameState: getGameState(socket.currentRoom)
            });
            
            console.log(`[Socket] Player ${socket.playerInfo.username} marked as disconnected in room ${socket.currentRoom}`);
            
            // If game is in progress, give player time to reconnect
            if (room.status === 'playing') {
              setTimeout(() => {
                const currentRoom = getRoom(socket.currentRoom);
                if (currentRoom) {
                  const currentPlayer = currentRoom.players.find(p => p.id === socket.playerInfo.id);
                  
                  if (currentPlayer && !currentPlayer.connected) {
                    // Player didn't reconnect, end the game
                    const emitToRoom = (event, data) => {
                      io.to(socket.currentRoom).emit(event, data);
                    };
                    
                    endGame(socket.currentRoom, 'player_leave', emitToRoom);
                    
                    // Remove player from room
                    leaveRoom(socket.currentRoom, socket.playerInfo.id);
                    
                    // Redirect remaining players
                    io.to(socket.currentRoom).emit('redirect_home', {
                      reason: 'player_disconnected',
                      message: `${socket.playerInfo.username} disconnected and didn't return`
                    });
                  }
                }
              }, 30000); // 30 second grace period
            }
          }
        }
      }
    });
    
    /**
     * Request current game state
     * Payload: { roomId }
     */
    socket.on('get_game_state', (data) => {
      try {
        const { roomId } = data;
        const gameState = getGameState(roomId);
        
        if (gameState) {
          socket.emit('game_state', gameState);
        } else {
          socket.emit('error', { message: 'Room not found' });
        }
      } catch (error) {
        console.error('[Socket] Error in get_game_state:', error);
        socket.emit('error', { message: 'Failed to get game state' });
      }
    });
    
    /**
     * Ping/Pong for connection health check
     */
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
  
  console.log('[Socket] Handlers setup complete');
}

module.exports = setupSocketHandlers;
