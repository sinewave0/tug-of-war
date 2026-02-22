'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface KeypadProps {
  onNumber: (num: number) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  currentValue: string;
  disabled?: boolean;
}

type KeypadButton = {
  label: string;
  kind: 'digit' | 'danger' | 'primary';
  value?: number;
  action?: 'backspace' | 'submit';
};

export const Keypad: React.FC<KeypadProps> = ({
  onNumber,
  onBackspace,
  onSubmit,
  currentValue,
  disabled = false,
}) => {
  const buttons: KeypadButton[] = [
    { label: '1', value: 1, kind: 'digit' },
    { label: '2', value: 2, kind: 'digit' },
    { label: '3', value: 3, kind: 'digit' },
    { label: '4', value: 4, kind: 'digit' },
    { label: '5', value: 5, kind: 'digit' },
    { label: '6', value: 6, kind: 'digit' },
    { label: '7', value: 7, kind: 'digit' },
    { label: '8', value: 8, kind: 'digit' },
    { label: '9', value: 9, kind: 'digit' },
    { label: 'DEL', action: 'backspace', kind: 'danger' },
    { label: '0', value: 0, kind: 'digit' },
    { label: 'PULL', action: 'submit', kind: 'primary' },
  ];

  const handleClick = (btn: KeypadButton) => {
    if (disabled) return;

    if (btn.action === 'backspace') {
      onBackspace();
      return;
    }

    if (btn.action === 'submit') {
      onSubmit();
      return;
    }

    if (btn.value !== undefined) {
      onNumber(btn.value);
    }
  };

  return (
    <div className="panel rounded-2xl border border-slate-600/80 bg-slate-900/85 p-4 shadow-[0_14px_34px_rgba(2,8,22,0.44)] sm:p-5">
      <div className="mb-4 rounded-xl border border-slate-500/50 bg-slate-950/80 px-4 py-3">
        <p className="font-display text-[11px] tracking-[0.18em] text-slate-400">INPUT</p>
        <div className="mt-1 min-h-[38px] numeric-display text-4xl text-slate-100">
          {currentValue || '---'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {buttons.map((btn) => (
          <motion.button
            key={btn.label}
            whileTap={!disabled ? { scale: 0.96 } : {}}
            onClick={() => handleClick(btn)}
            disabled={disabled}
            className={[
              'action-button numeric-display h-14 rounded-xl border text-xl sm:h-16 sm:text-2xl',
              btn.kind === 'primary'
                ? 'border-emerald-400/80 bg-gradient-to-b from-emerald-300 to-emerald-500 text-emerald-950 shadow-[0_8px_20px_rgba(5,80,35,0.4)]'
                : btn.kind === 'danger'
                ? 'border-rose-400/80 bg-gradient-to-b from-rose-400 to-rose-600 text-rose-50 shadow-[0_8px_20px_rgba(80,8,15,0.35)]'
                : 'border-slate-500/70 bg-gradient-to-b from-slate-200 to-slate-300 text-slate-900 shadow-[0_6px_16px_rgba(3,8,18,0.28)]',
            ].join(' ')}
          >
            {btn.label}
          </motion.button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">Keyboard: numbers, Enter to submit, Backspace to delete.</p>
    </div>
  );
};
