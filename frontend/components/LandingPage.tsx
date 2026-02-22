'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { QuestionType } from '@/types/game';

interface LandingPageProps {
  onCreateRoom: (username: string, questionTypes: QuestionType[]) => void;
  onJoinRoom: (roomId: string, username: string) => void;
  isLoading?: boolean;
}

const OPERATION_OPTIONS: Array<{ value: QuestionType; label: string; symbol: string }> = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '-' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
];

const DEFAULT_QUESTION_TYPES: QuestionType[] = OPERATION_OPTIONS.map(option => option.value);

const sortQuestionTypes = (types: QuestionType[]): QuestionType[] =>
  OPERATION_OPTIONS
    .map(option => option.value)
    .filter((value) => types.includes(value));

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
}) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(DEFAULT_QUESTION_TYPES);
  const [error, setError] = useState('');

  const validateUsername = (name: string): boolean => {
    if (!name.trim()) {
      setError('Enter a username.');
      return false;
    }
    if (name.length > 10) {
      setError('Username must be 10 characters or less.');
      return false;
    }
    return true;
  };

  const handleCreateRoom = () => {
    setError('');
    if (selectedQuestionTypes.length === 0) {
      setError('Pick at least one question type.');
      return;
    }
    if (validateUsername(username)) {
      onCreateRoom(username.trim(), selectedQuestionTypes);
    }
  };

  const handleJoinRoom = () => {
    setError('');
    if (!validateUsername(username)) return;
    if (!roomId.trim()) {
      setError('Enter a room code.');
      return;
    }
    onJoinRoom(roomId.trim().toUpperCase(), username.trim());
  };

  const allSelected = selectedQuestionTypes.length === OPERATION_OPTIONS.length;

  const selectAllQuestionTypes = () => {
    setError('');
    setSelectedQuestionTypes([...DEFAULT_QUESTION_TYPES]);
  };

  const toggleQuestionType = (type: QuestionType) => {
    setError('');
    setSelectedQuestionTypes((current) => {
      if (current.includes(type)) {
        return current.filter((value) => value !== type);
      }
      return sortQuestionTypes([...current, type]);
    });
  };

  return (
    <div className="min-h-screen py-8 sm:py-10">
      <div className="screen-shell relative z-10">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel headline-shine rounded-3xl border border-slate-600/80 bg-slate-900/85 p-6 shadow-[0_18px_44px_rgba(2,9,26,0.5)] sm:p-8"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/55 bg-emerald-400/20 px-3 py-1">
              <span className="status-pulse h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="font-display text-xs text-emerald-50">Live Broadcast</span>
            </div>

            <h1 className="font-display text-5xl leading-none text-slate-50 drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] sm:text-7xl">
              Math Tug Arena
            </h1>
            <p className="mt-4 max-w-lg text-base text-slate-200 sm:text-lg">
              Head-to-head speed math. Every correct answer pulls the rope. First side to drag
              the flag across the line owns the match.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="panel-soft rounded-2xl border border-slate-600/70 bg-slate-900/70 p-4">
                <p className="font-display text-xs text-slate-200">Format</p>
                <p className="mt-2 font-display text-2xl text-slate-50">1v1 Duel</p>
              </div>
              <div className="panel-soft rounded-2xl border border-slate-600/70 bg-slate-900/70 p-4">
                <p className="font-display text-xs text-slate-200">Clock</p>
                <p className="mt-2 font-display text-2xl text-slate-50">03:00</p>
              </div>
              <div className="panel-soft rounded-2xl border border-slate-600/70 bg-slate-900/70 p-4">
                <p className="font-display text-xs text-slate-200">Win Rule</p>
                <p className="mt-2 font-display text-2xl text-slate-50">Flag Pull</p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="panel rounded-3xl border border-slate-600/80 bg-slate-900/85 p-5 shadow-[0_18px_44px_rgba(2,9,26,0.5)] sm:p-6"
          >
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-500/70 bg-slate-900/70 p-1">
              <button
                onClick={() => setMode('create')}
                className={`font-display rounded-xl px-3 py-2 text-sm ${
                  mode === 'create'
                    ? 'bg-blue-600 text-blue-50 shadow-[0_8px_20px_rgba(11,44,110,0.4)]'
                    : 'text-slate-200 hover:bg-slate-700/45'
                }`}
              >
                Create Match
              </button>
              <button
                onClick={() => setMode('join')}
                className={`font-display rounded-xl px-3 py-2 text-sm ${
                  mode === 'join'
                    ? 'bg-rose-600 text-rose-50 shadow-[0_8px_20px_rgba(103,20,20,0.4)]'
                    : 'text-slate-200 hover:bg-slate-700/45'
                }`}
              >
                Join Match
              </button>
            </div>

            {mode === 'select' && (
              <div className="space-y-3">
                <button
                  onClick={() => setMode('create')}
                  className="action-button action-button-secondary w-full py-3.5 font-display text-lg"
                >
                  Create Match
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="action-button w-full bg-gradient-to-r from-rose-500 to-red-600 py-3.5 font-display text-lg text-rose-50 shadow-[0_10px_24px_rgba(95,18,18,0.35)]"
                >
                  Join Match
                </button>
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-4">
                <p className="font-display text-2xl text-slate-50">Host a Room</p>
                <label className="block">
                  <span className="font-display text-xs text-slate-300">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="MAX 10 CHARS"
                    maxLength={10}
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-xl border border-slate-500/90 bg-slate-950/85 px-3 py-3 text-slate-100 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-300/25"
                  />
                </label>

                <div className="rounded-xl border border-slate-600/80 bg-slate-950/65 p-3">
                  <p className="font-display text-xs text-slate-300">Question Types</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Choose one or any combination before the match starts.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={selectAllQuestionTypes}
                      className={`rounded-lg border px-3 py-2 text-left transition ${
                        allSelected
                          ? 'border-blue-300/70 bg-blue-500/30 text-blue-50'
                          : 'border-slate-500/80 bg-slate-900/70 text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="font-display text-xs">All Types</span>
                    </button>
                    {OPERATION_OPTIONS.map((option) => {
                      const active = selectedQuestionTypes.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleQuestionType(option.value)}
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            active
                              ? 'border-emerald-300/70 bg-emerald-500/25 text-emerald-50'
                              : 'border-slate-500/80 bg-slate-900/70 text-slate-200 hover:bg-slate-800/70'
                          }`}
                        >
                          <p className="font-display text-xs">{option.label}</p>
                          <p className="font-display text-lg leading-none">{option.symbol}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <p className="rounded-xl bg-rose-500/20 px-3 py-2 text-sm text-rose-100">{error}</p>}

                <button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="action-button action-button-primary w-full py-3.5 font-display text-lg"
                >
                  {isLoading ? 'Building Arena...' : 'Start Match'}
                </button>
              </div>
            )}

            {mode === 'join' && (
              <div className="space-y-4">
                <p className="font-display text-2xl text-slate-50">Enter Broadcast</p>
                <label className="block">
                  <span className="font-display text-xs text-slate-300">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="MAX 10 CHARS"
                    maxLength={10}
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-xl border border-slate-500/90 bg-slate-950/85 px-3 py-3 text-slate-100 placeholder-slate-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-300/25"
                  />
                </label>

                <label className="block">
                  <span className="font-display text-xs text-slate-300">Room Code</span>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-xl border border-slate-500/90 bg-slate-950/85 px-3 py-3 uppercase tracking-[0.24em] text-slate-100 placeholder-slate-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-300/25"
                  />
                </label>

                {error && <p className="rounded-xl bg-rose-500/20 px-3 py-2 text-sm text-rose-100">{error}</p>}

                <button
                  onClick={handleJoinRoom}
                  disabled={isLoading}
                  className="action-button w-full bg-gradient-to-r from-rose-500 to-red-600 py-3.5 font-display text-lg text-rose-50 shadow-[0_10px_24px_rgba(95,18,18,0.35)]"
                >
                  {isLoading ? 'Entering...' : 'Join Match'}
                </button>
              </div>
            )}

            <p className="mt-5 text-center text-xs text-slate-300">
              Private room, two players, one winner.
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
};
