'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player, QuestionType } from '@/types/game';

interface RoomLobbyProps {
  roomId: string;
  players: Player[];
  questionTypes: QuestionType[];
  currentPlayerId: string;
  countdown: number | null;
  onReady: () => void;
  onLeave: () => void;
  isReady: boolean;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
};

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomId,
  players,
  questionTypes = [],
  currentPlayerId,
  countdown,
  onReady,
  onLeave,
  isReady,
}) => {
  const [copied, setCopied] = useState(false);

  const allReady = players.length === 2 && players.every((p) => p.isReady);
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const opponent = players.find((p) => p.id !== currentPlayerId);
  const configuredTypes = questionTypes.length > 0 ? questionTypes : (['addition', 'subtraction', 'multiplication', 'division'] as QuestionType[]);

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="screen-shell relative z-10 space-y-4">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel rounded-3xl border border-slate-600/80 bg-slate-900/85 p-5 shadow-[0_16px_40px_rgba(2,8,22,0.48)] sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xs text-slate-400">Match Lobby</p>
              <h1 className="font-display text-4xl text-slate-50">Pre-Game Setup</h1>
            </div>
            <button
              onClick={copyRoomId}
              className="rounded-xl border border-blue-300/50 bg-blue-500/20 px-4 py-2 text-left transition hover:bg-blue-500/30"
            >
              <p className="font-display text-[10px] text-blue-100">Room Code</p>
              <p className="numeric-display text-2xl text-slate-50">{roomId}</p>
            </button>
          </div>
          {copied && <p className="mt-2 text-xs text-emerald-200">Room code copied.</p>}
        </motion.header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="panel rounded-3xl border border-slate-600/80 bg-slate-900/85 p-5 shadow-[0_16px_40px_rgba(2,8,22,0.48)] sm:p-6"
          >
            <p className="font-display text-xs text-slate-400">Teams</p>
            <div className="mt-3 space-y-3">
              {currentPlayer && (
                <div
                  className={`rounded-2xl border p-4 ${
                    currentPlayer.isReady
                      ? 'border-emerald-300/70 bg-emerald-400/15'
                      : 'border-blue-300/70 bg-blue-500/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xl text-slate-50">{currentPlayer.username}</p>
                      <p className="text-xs text-slate-300">You</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xs text-slate-300">Status</p>
                      <p className="font-display text-lg text-slate-100">
                        {currentPlayer.isReady ? 'Ready' : 'Waiting'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {opponent ? (
                <div
                  className={`rounded-2xl border p-4 ${
                    opponent.isReady
                      ? 'border-emerald-300/70 bg-emerald-400/15'
                      : 'border-rose-300/70 bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xl text-slate-50">{opponent.username}</p>
                      <p className="text-xs text-slate-300">Opponent</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xs text-slate-300">Status</p>
                      <p className="font-display text-lg text-slate-100">
                        {opponent.isReady ? 'Ready' : 'Awaiting'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-500/80 bg-slate-950/35 p-6 text-center">
                  <p className="font-display text-sm text-slate-300">Waiting For Challenger</p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="panel rounded-3xl border border-slate-600/80 bg-slate-900/85 p-5 shadow-[0_16px_40px_rgba(2,8,22,0.48)] sm:p-6"
          >
            <p className="font-display text-xs text-slate-400">Match Status</p>

            <div className="mt-3 rounded-2xl border border-slate-500/60 bg-slate-950/65 p-4 text-center">
              {countdown !== null && countdown > 0 ? (
                <>
                  <p className="font-display text-xs text-amber-200">Kickoff In</p>
                  <p className="numeric-display text-7xl leading-none text-amber-100">{countdown}</p>
                </>
              ) : (
                <>
                  <p className="font-display text-xs text-slate-300">Players</p>
                  <p className="numeric-display text-5xl text-slate-100">{players.length}/2</p>
                </>
              )}
            </div>

            <p className="mt-3 text-sm text-slate-300">
              {players.length < 2
                ? 'Share the room code to invite your opponent.'
                : allReady
                ? 'All players locked in. Match launch imminent.'
                : 'Both players must mark ready to begin.'}
            </p>

            <div className="mt-3 rounded-2xl border border-slate-500/60 bg-slate-950/65 p-3">
              <p className="font-display text-xs text-slate-300">Question Mix</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {configuredTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-blue-300/60 bg-blue-500/20 px-2.5 py-1 text-[11px] text-blue-100"
                  >
                    {QUESTION_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {!isReady && (
                <button
                  onClick={onReady}
                  disabled={countdown !== null}
                  className="action-button action-button-primary w-full py-3 font-display text-lg"
                >
                  Ready Up
                </button>
              )}
              <button
                onClick={onLeave}
                className="action-button action-button-danger w-full py-3 font-display text-lg"
              >
                Leave Lobby
              </button>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};
