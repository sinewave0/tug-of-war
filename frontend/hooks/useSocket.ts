'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';
import {
  Room,
  Question,
  QuestionType,
  AnswerResult,
  Player,
  RoomCreatedPayload,
  RoomJoinedPayload,
  PlayerJoinedPayload,
  PlayerReadyPayload,
  CountdownPayload,
  NewQuestionPayload,
  RopeAnimationPayload,
  TimerPayload,
  GameOverPayload,
} from '@/types/game';
import type { Socket } from 'socket.io-client';

interface UseSocketProps {
  onRoomCreated?: (room: Room, player: Player) => void;
  onRoomJoined?: (room: Room, player: Player) => void;
  onPlayerJoined?: (payload: PlayerJoinedPayload) => void;
  onGameStart?: (question: Question | null, timerRemaining: number) => void;
  onCountdown?: (value: number) => void;
  onNewQuestion?: (question: Question) => void;
  onAnswerResult?: (result: AnswerResult) => void;
  onRopeAnimation?: (payload: RopeAnimationPayload) => void;
  onTimerUpdate?: (timeRemaining: number) => void;
  onGameOver?: (gameOver: GameOverPayload) => void;
  onRedirectHome?: () => void;
  onPlayerReady?: (update: PlayerReadyPayload) => void;
  onError?: (message: string) => void;
}

export const useSocket = (props: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const propsRef = useRef(props);

  // Keep props ref up to date
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onRoomCreated = (payload: RoomCreatedPayload) => {
      propsRef.current.onRoomCreated?.(payload.gameState as Room, payload.player);
    };

    const onRoomJoined = (payload: RoomJoinedPayload) => {
      propsRef.current.onRoomJoined?.(payload.gameState as Room, payload.player);
    };

    const onPlayerJoined = (payload: PlayerJoinedPayload) => {
      propsRef.current.onPlayerJoined?.(payload);
    };

    const onGameStart = (payload: { question: Question | null; timerRemaining: number }) => {
      propsRef.current.onGameStart?.(payload.question ?? null, payload.timerRemaining);
    };

    const onCountdown = (payload: CountdownPayload) => {
      propsRef.current.onCountdown?.(payload.countdown);
    };

    const onNewQuestion = (payload: NewQuestionPayload) => {
      propsRef.current.onNewQuestion?.(payload.question);
    };

    const onAnswerResult = (result: AnswerResult) => {
      propsRef.current.onAnswerResult?.(result);
    };

    const onRopeAnimation = (payload: RopeAnimationPayload) => {
      propsRef.current.onRopeAnimation?.(payload);
    };

    const onTimerUpdate = (payload: TimerPayload) => {
      propsRef.current.onTimerUpdate?.(payload.timerRemaining);
    };

    const onGameOver = (payload: GameOverPayload) => {
      propsRef.current.onGameOver?.(payload);
    };

    const onRedirectHome = () => {
      propsRef.current.onRedirectHome?.();
    };

    const onPlayerReady = (payload: PlayerReadyPayload) => {
      propsRef.current.onPlayerReady?.(payload);
    };

    const onError = (error: { message?: string } | string) => {
      if (typeof error === 'string') {
        propsRef.current.onError?.(error);
        return;
      }
      propsRef.current.onError?.(error?.message ?? 'Unknown socket error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('player_joined', onPlayerJoined);
    socket.on('game_start_countdown', onCountdown);
    socket.on('game_start', onGameStart);
    socket.on('new_question', onNewQuestion);
    socket.on('answer_result', onAnswerResult);
    socket.on('rope_animation_event', onRopeAnimation);
    socket.on('timer_update', onTimerUpdate);
    socket.on('game_over', onGameOver);
    socket.on('redirect_home', onRedirectHome);
    socket.on('player_ready_update', onPlayerReady);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('player_joined', onPlayerJoined);
      socket.off('game_start_countdown', onCountdown);
      socket.off('game_start', onGameStart);
      socket.off('new_question', onNewQuestion);
      socket.off('answer_result', onAnswerResult);
      socket.off('rope_animation_event', onRopeAnimation);
      socket.off('timer_update', onTimerUpdate);
      socket.off('game_over', onGameOver);
      socket.off('redirect_home', onRedirectHome);
      socket.off('player_ready_update', onPlayerReady);
      socket.off('error', onError);
    };
  }, []);

  const getPlayerId = useCallback(() => {
    if (playerIdRef.current) {
      return playerIdRef.current;
    }

    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('math-tug-player-id') : null;
    if (saved) {
      playerIdRef.current = saved;
      return saved;
    }

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('math-tug-player-id', generated);
    }
    playerIdRef.current = generated;
    return generated;
  }, []);

  const createRoom = useCallback((username: string, questionTypes: QuestionType[]) => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }
    const playerId = getPlayerId();
    socket.emit('create_room', { playerId, username, questionTypes });
  }, [getPlayerId]);

  const joinRoom = useCallback((roomId: string, username: string) => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }
    const playerId = getPlayerId();
    socket.emit('join_room', { roomId, playerId, username });
  }, [getPlayerId]);

  const setPlayerReady = useCallback((roomId: string) => {
    const socket = socketRef.current;
    const playerId = playerIdRef.current;
    if (!socket || !playerId) {
      return;
    }
    socket.emit('player_ready', { roomId, playerId });
  }, []);

  const submitAnswer = useCallback((roomId: string, questionId: string, answer: number) => {
    const socket = socketRef.current;
    const playerId = playerIdRef.current;
    if (!socket || !playerId) {
      return;
    }
    socket.emit('submit_answer', { roomId, playerId, questionId, answer });
  }, []);

  const leaveGame = useCallback((roomId: string) => {
    const socket = socketRef.current;
    const playerId = playerIdRef.current;
    if (!socket || !playerId) {
      return;
    }
    socket.emit('leave_game', { roomId, playerId });
  }, []);

  const reconnectPlayer = useCallback((playerId: string, roomId: string) => {
    socketRef.current?.emit('reconnect_player', { playerId, roomId });
  }, []);

  return {
    isConnected,
    createRoom,
    joinRoom,
    setPlayerReady,
    submitAnswer,
    leaveGame,
    reconnectPlayer,
  };
};
