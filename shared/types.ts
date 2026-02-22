// Player type
export interface Player {
  id: string;
  username: string;
  score: number;
  connected: boolean;
  isReady: boolean;
  side: 'left' | 'right';
}

// Room state
export interface Room {
  roomId: string;
  players: Player[];
  ropePosition: number;
  status: 'waiting' | 'playing' | 'finished';
  timeRemaining: number;
  questionTypes: Array<'addition' | 'subtraction' | 'multiplication' | 'division'>;
  currentQuestion?: Question;
}

// Math question
export interface Question {
  id: string;
  text: string;
  answer: number;
  type?: 'addition' | 'subtraction' | 'multiplication' | 'division';
}

// Socket events
export interface ServerToClientEvents {
  room_created: (data: { roomId: string }) => void;
  player_joined: (data: { players: Player[] }) => void;
  game_start: (data: { countdown: number }) => void;
  new_question: (data: Question) => void;
  answer_result: (data: { correct: boolean; playerId: string; newScore: number }) => void;
  rope_animation_event: (data: { direction: 'move_left' | 'move_right' | 'win_left' | 'win_right'; newPosition: number }) => void;
  timer_update: (data: { timeRemaining: number }) => void;
  game_over: (data: { winner: 'left' | 'right' | 'draw'; reason: 'timeout' | 'rope_threshold' }) => void;
  redirect_home: () => void;
  player_left: (data: { playerId: string }) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { username: string; questionTypes?: Array<'addition' | 'subtraction' | 'multiplication' | 'division'> }) => void;
  join_room: (data: { roomId: string; username: string }) => void;
  player_ready: (data: { roomId: string }) => void;
  submit_answer: (data: { roomId: string; answer: number }) => void;
  leave_game: (data: { roomId: string }) => void;
}
