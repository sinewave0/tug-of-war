export const GAME_DURATION = 180; // 3 minutes in seconds
export const ROPE_WIN_THRESHOLD = 100;
export const ROPE_MOVE_PER_CORRECT = 10;
export const MAX_USERNAME_LENGTH = 10;
export const COUNTDOWN_SECONDS = 3;

// Math question ranges
export const MATH_RANGES = {
  addition: { min1: 1, max1: 20, min2: 1, max2: 20 },
  subtraction: { min1: 1, max1: 40, min2: 1, max2: 20 },
  multiplication: { min1: 2, max1: 9, min2: 2, max2: 9 },
  division: { min1: 1, max1: 9, min2: 2, max2: 9 }, // result/divisor stay kid-friendly, question values under 100
};
