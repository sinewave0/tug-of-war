"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface RopeAnimationProps {
  ropePosition: number; // -100 to 100
  leftPlayer?: string;
  rightPlayer?: string;
}

interface AthleteProps {
  team: "left" | "right";
  facing: "left" | "right";
  baseX: number;
  jersey: string;
  trim: string;
  pullSide: "left" | "right" | null;
  delay: number;
}

const Athlete: React.FC<AthleteProps> = ({
  team,
  facing,
  baseX,
  jersey,
  trim,
  pullSide,
  delay,
}) => {
  const isPulling = pullSide === team;
  const isResisting = pullSide !== null && pullSide !== team;
  const baseLean = team === "left" ? -11 : 11;

  const lean = baseLean + (isPulling ? (team === "left" ? -8 : 8) : 0) + (isResisting ? (team === "left" ? 4 : -4) : 0);
  const offsetX = (isPulling ? (team === "left" ? -8 : 8) : 0) + (isResisting ? (team === "left" ? 4 : -4) : 0);
  const offsetY = (isPulling ? -4 : 0) + (isResisting ? 2 : 0);

  return (
    <motion.g
      initial={false}
      animate={{ x: baseX + offsetX, y: offsetY, rotate: lean }}
      transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.7, delay }}
    >
      <g transform={`scale(${facing === "left" ? -1 : 1}, 1)`}>
        <circle cx="0" cy="-44" r="12" fill="#f2c9a4" stroke="#d5a076" strokeWidth="1.4" />
        <ellipse cx="-1" cy="-53" rx="12" ry="6" fill="#1d2f48" />

        <path d="M -8 -30 L -15 16" stroke={jersey} strokeWidth="17" strokeLinecap="round" />
        <path d="M -9 -31 L -13 2" stroke={trim} strokeWidth="4" strokeLinecap="round" opacity="0.7" />

        <path d="M -8 -28 L 16 -26 L 30 -30" stroke="#f2c9a4" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M -10 -21 L 13 -19 L 25 -25" stroke="#f2c9a4" strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx="30" cy="-30" r="4" fill="#f2c9a4" />
        <circle cx="25" cy="-25" r="4" fill="#f2c9a4" />

        <path d="M -14 13 L -30 48" stroke="#22344f" strokeWidth="10" strokeLinecap="round" />
        <path d="M -8 12 L 7 48" stroke="#22344f" strokeWidth="10" strokeLinecap="round" />
        <ellipse cx="-31" cy="49" rx="11" ry="5" fill="#111927" />
        <ellipse cx="8" cy="49" rx="11" ry="5" fill="#111927" />
      </g>
    </motion.g>
  );
};

export const RopeAnimation: React.FC<RopeAnimationProps> = ({
  ropePosition,
  leftPlayer = "Blue Side",
  rightPlayer = "Red Side",
}) => {
  const springConfig = { stiffness: 130, damping: 16, mass: 1.15 };
  const positionSpring = useSpring(0, springConfig);
  const sceneX = useTransform(positionSpring, [-100, 100], [-170, 170]);

  const [displayPosition, setDisplayPosition] = useState(0);
  const [pullSide, setPullSide] = useState<"left" | "right" | null>(null);
  const previousDisplay = useRef(0);
  const clearPullTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    positionSpring.set(ropePosition);
  }, [ropePosition, positionSpring]);

  useEffect(() => {
    return () => {
      if (clearPullTimer.current) {
        clearTimeout(clearPullTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = positionSpring.on("change", (value) => {
      setDisplayPosition(value);

      const delta = value - previousDisplay.current;
      previousDisplay.current = value;

      if (Math.abs(delta) < 0.16) {
        return;
      }

      setPullSide(delta < 0 ? "left" : "right");
      if (clearPullTimer.current) {
        clearTimeout(clearPullTimer.current);
      }
      clearPullTimer.current = setTimeout(() => setPullSide(null), 260);
    });
    return unsubscribe;
  }, [positionSpring]);

  const leftPressing = displayPosition < -12;
  const rightPressing = displayPosition > 12;
  const barPosition = ((displayPosition + 100) / 200) * 100;

  const sag = Math.max(9, 30 - Math.min(Math.abs(displayPosition), 100) * 0.22);
  const ropePath = `M -430 -17 L -98 -17 Q 0 ${-17 + sag} 98 -17 L 430 -17`;
  const flagY = -17 + sag * 0.52;

  return (
    <section className="panel rounded-3xl border border-slate-600/80 bg-slate-900/85 p-3 shadow-[0_14px_34px_rgba(2,8,22,0.44)] sm:p-4">
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs sm:text-sm">
        <div className="truncate">
          <p className="font-display text-[10px] text-blue-200">Left Lane</p>
          <p className={`font-display truncate text-lg ${leftPressing ? "text-cyan-200" : "text-blue-100"}`}>
            {leftPlayer}
          </p>
        </div>

        <div className="text-center">
          <p className="font-display text-[10px] text-slate-400">Momentum</p>
          <p className="font-display text-lg text-slate-200">{Math.round(Math.abs(displayPosition))}</p>
        </div>

        <div className="truncate text-right">
          <p className="font-display text-[10px] text-rose-200">Right Lane</p>
          <p className={`font-display truncate text-lg ${rightPressing ? "text-rose-100" : "text-red-200"}`}>
            {rightPlayer}
          </p>
        </div>
      </div>

      <div className="mb-3 h-2 rounded-full bg-slate-900/80">
        <div className="relative h-full">
          <div className="absolute inset-y-0 left-0 rounded-l-full bg-gradient-to-r from-sky-600 to-sky-400" style={{ width: "50%" }} />
          <div className="absolute inset-y-0 right-0 rounded-r-full bg-gradient-to-l from-rose-600 to-red-400" style={{ width: "50%" }} />
          <motion.div
            className="absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded bg-slate-50 shadow-[0_0_12px_rgba(255,255,255,0.7)]"
            style={{ left: `${barPosition}%`, marginLeft: "-3px" }}
          />
        </div>
      </div>

      <div className="relative h-[250px] overflow-hidden rounded-2xl border border-slate-500/70 bg-slate-950 sm:h-[300px]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e2c52] via-[#102f56] to-[#1f5c35]" />
        <div className="crowd-pattern absolute inset-x-0 top-0 h-24 opacity-35 sm:h-28" />
        <div className="absolute inset-x-0 top-20 h-8 bg-gradient-to-b from-slate-950/60 to-transparent sm:top-24" />
        <div className="field-stripes absolute inset-x-0 bottom-0 h-[44%] opacity-85" />
        <div className="absolute inset-x-0 bottom-[44%] h-[2px] bg-white/20" />

        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 border-l-2 border-dashed border-slate-200/70" />

        {pullSide && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-3 py-1 font-display text-xs ${
              pullSide === "left" ? "bg-sky-400/80 text-sky-950" : "bg-rose-400/80 text-rose-950"
            }`}
          >
            {pullSide === "left" ? "Left Pull Surge" : "Right Pull Surge"}
          </motion.div>
        )}

        <motion.div className="absolute inset-0" style={{ x: sceneX }}>
          <svg viewBox="-360 -120 720 260" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            <path d={ropePath} stroke="#684d2f" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d={ropePath} stroke="#896845" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" transform="translate(0,-1.2)" />

            <g transform={`translate(0, ${flagY})`}>
              <line x1="0" y1="0" x2="0" y2="36" stroke="#f6f7fb" strokeWidth="2.3" />
              <path d="M 1 36 L 28 26 L 1 16 Z" fill="#ff4343" stroke="#b52424" strokeWidth="1.2" />
            </g>

            <Athlete team="left" facing="right" baseX={-172} jersey="#1e8de8" trim="#77c3ff" pullSide={pullSide} delay={0} />
            <Athlete team="left" facing="right" baseX={-104} jersey="#147ad0" trim="#57adee" pullSide={pullSide} delay={0.04} />
            <Athlete team="right" facing="left" baseX={104} jersey="#e74848" trim="#ff8f8f" pullSide={pullSide} delay={0.02} />
            <Athlete team="right" facing="left" baseX={172} jersey="#cf2d2d" trim="#f06c6c" pullSide={pullSide} delay={0.06} />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};
