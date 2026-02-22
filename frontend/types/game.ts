export type QuestionType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface Player {
  id: string;
  username: string;
  score: number;
  connected: boolean;
  isReady: boolean;
  side: 'left' | 'right';
}

export interface Room {
  roomId: string;
  players: Player[];
  ropePosition: number; // -100 to 100 (negative = left wins, positive = right wins)
  status: 'waiting' | 'playing' | 'finished';
  timerRemaining: number;
  currentQuestion: Question | null;
  questionTypes: QuestionType[];
}

export interface Question {
  id: string;
  text: string;
  answer: number;
  type?: QuestionType;
}

export interface AnswerResult {
  correct: boolean;
  playerId?: string;
  playerSide?: 'left' | 'right' | null;
  playerScore?: number;
  reason?: 'too_late';
  message?: string;
}

export interface GameState {
  roomId: string;
  players: Player[];
  ropePosition: number;
  currentQuestion: Question | null;
  timerRemaining: number;
  status: 'waiting' | 'playing' | 'finished';
  questionTypes: QuestionType[];
}

export interface RoomCreatedPayload {
  roomId: string;
  player: Player;
  gameState: GameState;
}

export interface RoomJoinedPayload {
  roomId: string;
  player: Player;
  gameState: GameState;
  isReconnect?: boolean;
}

export interface PlayerJoinedPayload {
  player: Player;
  gameState: GameState;
}

export interface PlayerReadyPayload {
  playerId: string;
  ready: boolean;
  bothReady: boolean;
}

export interface CountdownPayload {
  countdown: number;
}

export interface NewQuestionPayload {
  question: Question;
}

export interface RopeAnimationPayload {
  event: 'move_left' | 'move_right' | 'win_animation';
  ropePosition: number;
  playerSide: 'left' | 'right';
}

export interface TimerPayload {
  timerRemaining: number;
}

export interface GameOverPayload {
  roomId: string;
  reason: 'time_up' | 'rope_threshold' | 'player_leave';
  winner: { id: string; username: string; side: 'left' | 'right' } | null;
  winnerSide: 'left' | 'right' | null;
  ropePosition: number;
  players: Array<{
    id: string;
    username: string;
    score: number;
    side: 'left' | 'right';
  }>;
}

export type GameStatus = 'landing' | 'lobby' | 'playing' | 'finished';
