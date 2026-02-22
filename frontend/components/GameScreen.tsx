'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Question } from '@/types/game';
import { Keypad } from './Keypad';
import { RopeAnimation } from './RopeAnimation';

interface FeedbackMessage {
  tone: 'positive' | 'negative' | 'warning' | 'info';
  text: string;
}

interface GameScreenProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  currentQuestion: Question | null;
  ropePosition: number;
  timeRemaining: number;
  answerFeedback?: FeedbackMessage | null;
  onSubmitAnswer: (answer: number) => void;
  onLeaveGame: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  roomId,
  players,
  currentPlayerId,
  currentQuestion,
  ropePosition,
  timeRemaining,
  answerFeedback,
  onSubmitAnswer,
  onLeaveGame,
}) => {
  const [currentValue, setCurrentValue] = useState('');

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const leftPlayer = players.find((p) => p.side === 'left') ?? players[0];
  const rightPlayer = players.find((p) => p.side === 'right') ?? players[1];

  const handleNumber = useCallback((num: number) => {
    setCurrentValue((prev) => (prev.length < 6 ? `${prev}${num}` : prev));
  }, []);

  const handleBackspace = useCallback(() => {
    setCurrentValue((prev) => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !currentValue) return;
    const answer = Number.parseInt(currentValue, 10);
    if (Number.isNaN(answer)) return;
    onSubmitAnswer(answer);
    setCurrentValue('');
  }, [currentQuestion, currentValue, onSubmitAnswer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!currentQuestion) return;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        handleNumber(Number(event.key));
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQuestion, handleBackspace, handleNumber, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clockTone =
    timeRemaining <= 20 ? 'text-rose-200' : timeRemaining <= 45 ? 'text-amber-200' : 'text-emerald-200';
  const isCurrentLeft = currentPlayer?.side === 'left';
  const feedbackStyles: Record<FeedbackMessage['tone'], string> = {
    positive: 'border-emerald-300/70 bg-emerald-400/20 text-emerald-100',
    negative: 'border-rose-300/70 bg-rose-500/20 text-rose-100',
    warning: 'border-amber-300/70 bg-amber-500/20 text-amber-100',
    info: 'border-blue-300/70 bg-blue-500/20 text-blue-100',
  };

  return (
    <div className="min-h-screen py-3 sm:py-4">
      <div className="screen-shell relative z-10 space-y-3">
        <header className="panel rounded-2xl border border-slate-600/80 bg-slate-900/85 px-4 py-3 shadow-[0_14px_34px_rgba(2,8,22,0.44)]">
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-2">
              <span className="broadcast-chip rounded-full px-3 py-1 font-display text-[10px]">Room</span>
              <span className="numeric-display text-xl tracking-[0.12em] text-slate-100">{roomId}</span>
            </div>

            <div className="justify-self-start sm:justify-self-center">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-500/70 bg-slate-950/65 px-3 py-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${timeRemaining <= 20 ? 'bg-rose-300 status-pulse' : 'bg-emerald-300'}`} />
                <span className="font-display text-xs text-slate-300">Game Clock</span>
                <span className={`numeric-display text-2xl ${clockTone}`}>{formatTime(timeRemaining)}</span>
              </div>
            </div>

            <div className="justify-self-start sm:justify-self-end">
              <button
                onClick={onLeaveGame}
                className="action-button action-button-danger px-4 py-2 font-display text-sm"
              >
                Leave Match
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-3">
            <section className="panel rounded-2xl border border-slate-600/80 bg-slate-900/85 p-4 shadow-[0_14px_34px_rgba(2,8,22,0.44)]">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div
                  className={`rounded-2xl border p-3 ${
                    isCurrentLeft ? 'border-cyan-300/70 bg-cyan-400/15' : 'border-blue-400/55 bg-blue-500/10'
                  }`}
                >
                  <p className="font-display text-[10px] text-slate-300">Left Team</p>
                  <p className="font-display truncate text-2xl text-blue-100">{leftPlayer?.username ?? 'Left Side'}</p>
                  <p className="numeric-display text-5xl leading-none text-slate-100">{leftPlayer?.score ?? 0}</p>
                </div>

                <div className="text-center">
                  <p className="font-display text-xs text-slate-400">Current Side</p>
                  <p className="font-display text-xl text-slate-100">
                    {currentPlayer?.side ? currentPlayer.side.toUpperCase() : '--'}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-3 text-right ${
                    !isCurrentLeft ? 'border-rose-300/70 bg-rose-400/15' : 'border-rose-400/55 bg-rose-500/10'
                  }`}
                >
                  <p className="font-display text-[10px] text-slate-300">Right Team</p>
                  <p className="font-display truncate text-2xl text-red-100">{rightPlayer?.username ?? 'Right Side'}</p>
                  <p className="numeric-display text-5xl leading-none text-slate-100">{rightPlayer?.score ?? 0}</p>
                </div>
              </div>
            </section>

            <RopeAnimation
              ropePosition={ropePosition}
              leftPlayer={leftPlayer?.username}
              rightPlayer={rightPlayer?.username}
            />
          </div>

          <aside className="space-y-3">
            <section className="panel rounded-2xl border border-slate-600/80 bg-slate-900/85 p-4 shadow-[0_14px_34px_rgba(2,8,22,0.44)] sm:p-5">
              <p className="font-display text-xs text-slate-400">Current Question</p>
              <AnimatePresence mode="wait">
                {currentQuestion ? (
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 rounded-2xl border border-slate-500/70 bg-slate-950/70 p-4 text-center"
                  >
                    <p className="font-display text-[11px] text-slate-300">Solve Fast</p>
                    <p className="numeric-display mt-2 text-5xl leading-none text-slate-50">
                      {currentQuestion.text}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 rounded-2xl border border-slate-500/70 bg-slate-950/70 p-4 text-center"
                  >
                    <p className="font-display text-xs text-slate-300">Loading next challenge...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {answerFeedback && (
              <section className={`rounded-2xl border px-4 py-3 text-sm ${feedbackStyles[answerFeedback.tone]}`}>
                <p className="font-display text-[11px] tracking-[0.1em]">Play Update</p>
                <p className="mt-1">{answerFeedback.text}</p>
              </section>
            )}

            <Keypad
              onNumber={handleNumber}
              onBackspace={handleBackspace}
              onSubmit={handleSubmit}
              currentValue={currentValue}
              disabled={!currentQuestion}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
