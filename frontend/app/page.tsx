'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { RoomLobby } from '@/components/RoomLobby';
import { GameScreen } from '@/components/GameScreen';
import { GameOver } from '@/components/GameOver';
import { useSocket } from '@/hooks/useSocket';
import {
  Room,
  Question,
  QuestionType,
  Player,
  GameStatus,
  PlayerJoinedPayload,
  PlayerReadyPayload,
  RopeAnimationPayload,
  GameOverPayload,
} from '@/types/game';

export default function Home() {
  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>('landing');
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [ropePosition, setRopePosition] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [winner, setWinner] = useState<Player | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<{
    tone: 'positive' | 'negative' | 'warning' | 'info';
    text: string;
  } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAnswerFeedback = useCallback((
    tone: 'positive' | 'negative' | 'warning' | 'info',
    text: string,
    duration = 1400
  ) => {
    setAnswerFeedback({ tone, text });
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setAnswerFeedback(null);
      feedbackTimerRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Socket event handlers
  const handleRoomCreated = useCallback((newRoom: Room, player: Player) => {
    setRoom(newRoom);
    setCurrentPlayerId(player.id);
    setRopePosition(newRoom.ropePosition);
    setTimeRemaining(newRoom.timerRemaining);
    setCurrentQuestion(newRoom.currentQuestion);
    setGameStatus('lobby');
    setIsLoading(false);
    setError('');
    setAnswerFeedback(null);
  }, []);

  const handleRoomJoined = useCallback((joinedRoom: Room, player: Player) => {
    setRoom(joinedRoom);
    setCurrentPlayerId(player.id);
    setRopePosition(joinedRoom.ropePosition);
    setTimeRemaining(joinedRoom.timerRemaining);
    setCurrentQuestion(joinedRoom.currentQuestion);
    setGameStatus('lobby');
    setIsLoading(false);
    setError('');
    setAnswerFeedback(null);
  }, []);

  const handlePlayerJoined = useCallback((payload: PlayerJoinedPayload) => {
    setRoom(payload.gameState as Room);
    setRopePosition(payload.gameState.ropePosition);
    setTimeRemaining(payload.gameState.timerRemaining);
    setCurrentQuestion(payload.gameState.currentQuestion);
  }, []);

  const handlePlayerReady = useCallback((update: PlayerReadyPayload) => {
    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: prev.players.map(p => 
          p.id === update.playerId ? { ...p, isReady: update.ready } : p
        )
      };
    });
  }, []);

  const handleGameStart = useCallback((question: Question | null, initialTimer: number) => {
    setGameStatus('playing');
    setRopePosition(0);
    setTimeRemaining(initialTimer);
    setCurrentQuestion(question);
    setCountdown(null);
    setAnswerFeedback(null);
  }, []);

  const handleNewQuestion = useCallback((question: Question) => {
    setCurrentQuestion(question);
    setAnswerFeedback(null);
  }, []);

  const handleAnswerResult = useCallback((result: { correct: boolean; playerId?: string; playerScore?: number }) => {
    const newScore = result.playerScore;
    if (!result.correct || !result.playerId || newScore === undefined) {
      return;
    }
    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: prev.players.map(p => 
          p.id === result.playerId ? { ...p, score: newScore } : p
        )
      };
    });

    if (result.playerId === currentPlayerId) {
      showAnswerFeedback('positive', 'Perfect answer. You pulled the rope.');
      return;
    }

    const scorer = room?.players.find(p => p.id === result.playerId);
    showAnswerFeedback('info', `${scorer?.username ?? 'Opponent'} scored and pulled the rope.`);
  }, [currentPlayerId, room, showAnswerFeedback]);

  const handleAnswerResultExtended = useCallback((result: {
    correct: boolean;
    playerId?: string;
    playerScore?: number;
    reason?: 'too_late';
    message?: string;
  }) => {
    handleAnswerResult(result);

    if (result.correct) {
      return;
    }

    if (result.reason === 'too_late') {
      showAnswerFeedback('warning', result.message ?? 'Too slow. Question already taken.');
      return;
    }

    if (!result.playerId || result.playerId === currentPlayerId) {
      showAnswerFeedback('negative', result.message ?? 'Incorrect answer. Keep going.');
      return;
    }

    const playerName = room?.players.find(p => p.id === result.playerId)?.username ?? 'Opponent';
    showAnswerFeedback('info', `${playerName} missed the answer.`);
  }, [currentPlayerId, handleAnswerResult, room, showAnswerFeedback]);

  const handleRopeAnimation = useCallback((payload: RopeAnimationPayload) => {
    setRopePosition(payload.ropePosition);
  }, []);

  const handleTimerUpdate = useCallback((time: number) => {
    setTimeRemaining(time);
  }, []);

  const handleGameOver = useCallback((payload: GameOverPayload) => {
    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ropePosition: payload.ropePosition,
        players: prev.players.map(player => {
          const scoreData = payload.players.find(p => p.id === player.id);
          return scoreData ? { ...player, score: scoreData.score } : player;
        })
      };
    });
    setRopePosition(payload.ropePosition);
    const winnerScore = payload.winner
      ? payload.players.find(player => player.id === payload.winner?.id)?.score ?? 0
      : 0;
    setWinner(
      payload.winner
        ? {
            id: payload.winner.id,
            username: payload.winner.username,
            side: payload.winner.side,
            score: winnerScore,
            connected: true,
            isReady: true,
          }
        : null
    );
    setGameStatus('finished');
    setAnswerFeedback(null);
  }, []);

  const handleRedirectHome = useCallback(() => {
    setGameStatus('landing');
    setRoom(null);
    setCurrentQuestion(null);
    setRopePosition(0);
    setWinner(null);
    setCountdown(null);
    setAnswerFeedback(null);
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setIsLoading(false);
    setTimeout(() => setError(''), 5000);
  }, []);

  // Initialize socket
  const {
    createRoom,
    joinRoom,
    setPlayerReady,
    submitAnswer,
    leaveGame,
    isConnected,
  } = useSocket({
    onRoomCreated: handleRoomCreated,
    onRoomJoined: handleRoomJoined,
    onPlayerJoined: handlePlayerJoined,
    onPlayerReady: handlePlayerReady,
    onGameStart: handleGameStart,
    onCountdown: setCountdown,
    onNewQuestion: handleNewQuestion,
    onAnswerResult: handleAnswerResultExtended,
    onRopeAnimation: handleRopeAnimation,
    onTimerUpdate: handleTimerUpdate,
    onGameOver: handleGameOver,
    onRedirectHome: handleRedirectHome,
    onError: handleError,
  });

  // Action handlers
  const handleCreateRoom = useCallback((username: string, questionTypes: QuestionType[]) => {
    setIsLoading(true);
    createRoom(username, questionTypes);
  }, [createRoom]);

  const handleJoinRoom = useCallback((roomId: string, username: string) => {
    setIsLoading(true);
    joinRoom(roomId, username);
  }, [joinRoom]);

  const handleReady = useCallback(() => {
    if (room) {
      setPlayerReady(room.roomId);
    }
  }, [room, setPlayerReady]);

  const handleSubmitAnswer = useCallback((answer: number) => {
    if (room && currentQuestion) {
      submitAnswer(room.roomId, currentQuestion.id, answer);
    }
  }, [room, currentQuestion, submitAnswer]);

  const handleLeave = useCallback(() => {
    if (room) {
      leaveGame(room.roomId);
    }
    setGameStatus('landing');
    setRoom(null);
    setCountdown(null);
    setAnswerFeedback(null);
  }, [room, leaveGame]);

  const handlePlayAgain = useCallback(() => {
    setGameStatus('landing');
    setRoom(null);
    setCurrentQuestion(null);
    setRopePosition(0);
    setWinner(null);
    setCountdown(null);
    setAnswerFeedback(null);
  }, []);

  // Check if current player is ready
  const isCurrentPlayerReady = room?.players.find(p => p.id === currentPlayerId)?.isReady || false;

  // Render based on game status
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Connection Status */}
      {!isConnected && gameStatus !== 'landing' && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm font-medium z-50">
          Reconnecting to server...
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-rose-300/70 bg-rose-500/90 px-6 py-3 text-white shadow-lg">
          {error}
        </div>
      )}

      {gameStatus === 'landing' && (
        <LandingPage
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isLoading={isLoading}
        />
      )}

      {gameStatus === 'lobby' && room && (
        <RoomLobby
          roomId={room.roomId}
          players={room.players}
          questionTypes={room.questionTypes}
          currentPlayerId={currentPlayerId}
          countdown={countdown}
          onReady={handleReady}
          onLeave={handleLeave}
          isReady={isCurrentPlayerReady}
        />
      )}

      {gameStatus === 'playing' && room && (
        <GameScreen
          roomId={room.roomId}
          players={room.players}
          currentPlayerId={currentPlayerId}
          currentQuestion={currentQuestion}
          ropePosition={ropePosition}
          timeRemaining={timeRemaining}
          answerFeedback={answerFeedback}
          onSubmitAnswer={handleSubmitAnswer}
          onLeaveGame={handleLeave}
        />
      )}

      {gameStatus === 'finished' && room && (
        <GameOver
          winner={winner}
          players={room.players}
          currentPlayerId={currentPlayerId}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      )}
    </main>
  );
}
