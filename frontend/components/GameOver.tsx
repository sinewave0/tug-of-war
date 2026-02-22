'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types/game';

const seededValue = (seed: number) => {
  const value = Math.sin(seed * 7919) * 10000;
  return value - Math.floor(value);
};

interface GameOverProps {
  winner: Player | null;
  players: Player[];
  currentPlayerId: string;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  winner,
  players,
  currentPlayerId,
  onPlayAgain,
  onLeave,
}) => {
  const isWinner = winner?.id === currentPlayerId;
  const isTie = winner === null;

  const sparkles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: seededValue(index + 1) * 100,
        driftX: (seededValue(index + 3) - 0.5) * 120,
        duration: 2.1 + seededValue(index + 7) * 1.8,
        delay: seededValue(index + 11) * 1.4,
      })),
    []
  );

  const title = isWinner ? 'Victory' : isTie ? 'Draw' : 'Defeat';
  const subtitle = isWinner
    ? 'You dominated the pull.'
    : isTie
    ? 'Evenly matched to the final whistle.'
    : 'Regroup and hit the rematch.';

  return (
    <div className="min-h-screen py-8">
      <div className="screen-shell relative z-10 flex items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="panel relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-600/80 bg-slate-900/85 p-6 shadow-[0_18px_44px_rgba(2,8,22,0.5)] sm:p-8"
        >
          {isWinner && (
            <div className="pointer-events-none absolute inset-0">
              {sparkles.map((piece, index) => (
                <motion.div
                  key={index}
                  className="absolute h-2 w-2 rounded-sm bg-amber-300"
                  style={{ left: `${piece.left}%`, top: -16 }}
                  animate={{ y: 420, x: piece.driftX, rotate: 220 }}
                  transition={{
                    duration: piece.duration,
                    repeat: Infinity,
                    delay: piece.delay,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
          )}

          <p className="font-display text-xs text-slate-300">Final Result</p>
          <h1 className="font-display mt-1 text-6xl leading-none text-slate-50">{title}</h1>
          <p className="mt-2 text-slate-300">{subtitle}</p>

          <div className="mt-6 rounded-2xl border border-slate-500/70 bg-slate-950/65 p-4">
            <p className="font-display text-xs text-slate-400">Scoreboard</p>
            <div className="mt-3 space-y-2">
              {players.map((player) => {
                const playerWon = player.id === winner?.id;
                const isCurrent = player.id === currentPlayerId;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                      playerWon
                        ? 'border-amber-300/80 bg-amber-300/20'
                        : 'border-slate-500/60 bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <p className="font-display text-lg text-slate-50">{player.username}</p>
                      <p className="text-xs text-slate-300">
                        {isCurrent ? 'You' : 'Opponent'} · {player.side.toUpperCase()}
                      </p>
                    </div>
                    <p className="numeric-display text-4xl text-slate-100">{player.score}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              onClick={onPlayAgain}
              className="action-button action-button-primary w-full py-3.5 font-display text-lg"
            >
              Rematch
            </button>
            <button
              onClick={onLeave}
              className="action-button action-button-danger w-full py-3.5 font-display text-lg"
            >
              Exit Arena
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};
