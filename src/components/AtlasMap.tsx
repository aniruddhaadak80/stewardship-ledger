"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import type { ResearchSource } from "@/lib/types";

const themes = [
  { id: "oversight", label: "Oversight", x: 90, y: 100, color: "#1db7a5" },
  { id: "control", label: "Control", x: 300, y: 60, color: "#ff6b61" },
  { id: "evals", label: "Evidence", x: 520, y: 116, color: "#f4c95d" },
  { id: "interpretability", label: "Interpretability", x: 480, y: 300, color: "#8c7cf2" },
  { id: "agents", label: "Agents", x: 250, y: 340, color: "#d7f36b" },
  { id: "care", label: "Care / voice", x: 80, y: 285, color: "#ff9f68" },
];

const edges = [["oversight", "control"], ["control", "evals"], ["evals", "interpretability"], ["interpretability", "agents"], ["agents", "care"], ["care", "oversight"], ["control", "agents"]];

export function AtlasMap({ sources }: { sources: ResearchSource[] }) {
  const reduceMotion = useReducedMotion();
  const counts = useMemo(() => new Map(themes.map((theme) => [theme.id, sources.filter((source) => source.topics.includes(theme.id)).length])), [sources]);
  const nodeMap = useMemo(() => new Map(themes.map((theme) => [theme.id, theme])), []);

  return (
    <div className="atlas-map" role="img" aria-label="Animated map of alignment evidence themes">
      <div className="atlas-map__top"><span>Evidence graph / theme density</span><strong>{sources.length} sources</strong></div>
      <svg className="atlas-map__svg" viewBox="0 0 610 400" aria-hidden="true">
        <defs>
          <filter id="atlas-node-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="atlas-edge" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1db7a5" /><stop offset="0.52" stopColor="#f4c95d" /><stop offset="1" stopColor="#ff6b61" /></linearGradient>
        </defs>
        {edges.map(([from, to], index) => {
          const left = nodeMap.get(from);
          const right = nodeMap.get(to);
          if (!left || !right) return null;
          return <motion.line key={`${from}-${to}`} x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="url(#atlas-edge)" strokeWidth="2" strokeOpacity="0.65" initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }} animate={reduceMotion ? undefined : { pathLength: 1, opacity: 0.65 }} transition={{ duration: 1.1, delay: index * 0.08 }} />;
        })}
        {themes.map((theme, index) => {
          const count = counts.get(theme.id) ?? 0;
          const radius = 11 + Math.min(count, 8) * 1.2;
          return <motion.g key={theme.id} initial={reduceMotion ? false : { scale: 0, opacity: 0 }} animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }} transition={{ delay: 0.18 + index * 0.1, type: "spring", stiffness: 170, damping: 15 }} style={{ transformOrigin: `${theme.x}px ${theme.y}px` }}>
            <circle cx={theme.x} cy={theme.y} r={radius} fill={theme.color} filter="url(#atlas-node-glow)" />
            <circle cx={theme.x} cy={theme.y} r="5" fill="#101323" />
            <text x={theme.x} y={theme.y + 29} textAnchor="middle" fill="#f8f3e8" fontSize="10" fontWeight="800" letterSpacing="0.8">{theme.label.toUpperCase()}</text>
            <text x={theme.x} y={theme.y + 43} textAnchor="middle" fill="rgba(248,243,232,0.58)" fontSize="8" fontFamily="monospace">{count} links</text>
          </motion.g>;
        })}
        <circle cx="305" cy="200" r="28" fill="#101323" stroke="#d7f36b" strokeWidth="2" />
        <text x="305" y="197" textAnchor="middle" fill="#d7f36b" fontSize="8" fontWeight="800" letterSpacing="1">ALIGN</text>
        <text x="305" y="208" textAnchor="middle" fill="#f8f3e8" fontSize="8" fontWeight="800" letterSpacing="1">ACTION</text>
      </svg>
      <div className="atlas-map__bottom"><span /> Node size follows source coverage, not certainty.</div>
    </div>
  );
}
