"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const nodes = [
  { id: "voice", label: "Voice", x: 94, y: 116, color: "#ff6b61" },
  { id: "oversight", label: "Oversight", x: 450, y: 100, color: "#1db7a5" },
  { id: "reversibility", label: "Reversibility", x: 470, y: 374, color: "#f4c95d" },
  { id: "impact", label: "Impact", x: 100, y: 392, color: "#8c7cf2" },
  { id: "autonomy", label: "Autonomy", x: 274, y: 52, color: "#ff6b61" },
];

const edges = [
  ["voice", "oversight"],
  ["voice", "impact"],
  ["oversight", "reversibility"],
  ["reversibility", "impact"],
  ["autonomy", "voice"],
  ["autonomy", "oversight"],
];

export function LatticeCanvas({ score = 58 }: { score?: number }) {
  const reduceMotion = useReducedMotion();
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), []);
  const ring = 78 + Math.min(score, 100) * 0.34;

  return (
    <div className="lattice-frame" aria-label="Animated relationship lattice for the stewardship model" role="img">
      <div className="lattice-caption">
        <span>Relational field / live case shape</span>
        <strong>{score}/100</strong>
      </div>
      <svg viewBox="0 0 560 500" className="lattice-svg" aria-hidden="true">
        <defs>
          <filter id="lattice-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lattice-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff6b61" />
            <stop offset="0.5" stopColor="#f4c95d" />
            <stop offset="1" stopColor="#1db7a5" />
          </linearGradient>
        </defs>
        <circle cx="280" cy="250" r={ring} fill="none" stroke="#1db7a5" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 10" />
        <circle cx="280" cy="250" r={ring - 26} fill="#f4c95d" fillOpacity="0.08" stroke="#f4c95d" strokeOpacity="0.25" strokeWidth="1" />
        {edges.map(([from, to], index) => {
          const left = nodeMap.get(from);
          const right = nodeMap.get(to);
          if (!left || !right) {
            return null;
          }
          return (
            <motion.line
              key={`${from}-${to}`}
              x1={left.x}
              y1={left.y}
              x2={right.x}
              y2={right.y}
              stroke="url(#lattice-stroke)"
              strokeWidth="2"
              strokeOpacity="0.62"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={reduceMotion ? undefined : { pathLength: 1, opacity: 0.62 }}
              transition={{ duration: 1.2, delay: index * 0.08, ease: "easeOut" }}
            />
          );
        })}
        {nodes.map((node, index) => (
          <motion.g
            key={node.id}
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.18 + index * 0.1, type: "spring", stiffness: 170, damping: 16 }}
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          >
            <circle cx={node.x} cy={node.y} r="14" fill={node.color} filter="url(#lattice-glow)" />
            <circle cx={node.x} cy={node.y} r="6" fill="#fffaf0" />
            <text x={node.x} y={node.y + 34} textAnchor="middle" fill="#241832" fontSize="12" fontWeight="700" letterSpacing="1.2">
              {node.label.toUpperCase()}
            </text>
          </motion.g>
        ))}
        <motion.circle
          cx="280"
          cy="250"
          r="40"
          fill="#241832"
          stroke="#ff6b61"
          strokeWidth="3"
          initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
          animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5, type: "spring" }}
          style={{ transformOrigin: "280px 250px" }}
        />
        <text x="280" y="247" textAnchor="middle" fill="#fffaf0" fontSize="11" fontWeight="700" letterSpacing="1.5">CARE</text>
        <text x="280" y="264" textAnchor="middle" fill="#f4c95d" fontSize="11" fontWeight="700" letterSpacing="1.5">MATTER</text>
      </svg>
      <div className="lattice-footnote"><span /> No single metric gets to define safety.</div>
    </div>
  );
}
