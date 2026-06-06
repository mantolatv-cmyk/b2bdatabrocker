"use client";

/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — InsightCard Premium
 * ═══════════════════════════════════════════
 * Card de Insight com glassmorphism, glow dinâmico por severidade,
 * animações Framer Motion e tipografia premium.
 *
 * Severity → Glow Color:
 *   LOW      → Cyan
 *   MEDIUM   → Violet
 *   HIGH     → Amber
 *   CRITICAL → Red (pulsing)
 *
 * InsightType → Icon/Badge:
 *   RISK_ALERT        → 🛡️ Shield
 *   OPPORTUNITY       → 🎯 Target
 *   TREND             → 📈 Chart
 *   COMPETITIVE_MOVE  → ⚔️ Swords
 *   REGULATORY_CHANGE → 📋 Clipboard
 */

import { motion } from "framer-motion";
import { formatRelativeTime, formatConfidence } from "@/lib/utils";

// ── Types ──
type InsightType = "RISK_ALERT" | "OPPORTUNITY" | "TREND" | "COMPETITIVE_MOVE" | "REGULATORY_CHANGE";
type InsightSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface InsightCardProps {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  summary: string;
  recommendation?: string;
  confidence: number;
  tags: string[];
  createdAt: string;
  isRead?: boolean;
  onClick?: (id: string) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  probability?: number;
  timeframe?: string;
  financialImpact?: string;
}

// ── Visual Maps ──
const SEVERITY_CONFIG = {
  LOW: {
    label: "Baixo",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.06)]",
    barColor: "bg-cyan-400",
    dotColor: "bg-cyan-400",
    borderNeon: "group-hover:border-neon-cyan",
  },
  MEDIUM: {
    label: "Médio",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    glow: "shadow-[0_0_20px_rgba(167,139,250,0.06)]",
    barColor: "bg-violet-400",
    dotColor: "bg-violet-400",
    borderNeon: "group-hover:border-neon-violet",
  },
  HIGH: {
    label: "Alto",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    glow: "shadow-[0_0_25px_rgba(251,191,36,0.08)]",
    barColor: "bg-amber-400",
    dotColor: "bg-amber-400",
    borderNeon: "group-hover:border-neon-amber",
  },
  CRITICAL: {
    label: "Crítico",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    glow: "shadow-[0_0_30px_rgba(248,113,113,0.12)]",
    barColor: "bg-red-400",
    dotColor: "bg-red-400 animate-pulse",
    borderNeon: "group-hover:border-neon-red",
  },
} as const;

const TYPE_CONFIG = {
  RISK_ALERT: { label: "Previsão de Risco", icon: "🛡️", accent: "text-red-400" },
  OPPORTUNITY: { label: "Oportunidade de Lucro", icon: "🎯", accent: "text-emerald-400" },
  TREND: { label: "Tendência", icon: "📈", accent: "text-blue-400" },
  COMPETITIVE_MOVE: { label: "Mov. Competitivo", icon: "⚔️", accent: "text-amber-400" },
  REGULATORY_CHANGE: { label: "Regulatório", icon: "📋", accent: "text-violet-400" },
} as const;

// ── Animation Variants ──
const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ── Component ──
export default function InsightCard({
  id,
  type,
  severity,
  title,
  summary,
  recommendation,
  confidence,
  tags,
  createdAt,
  isRead = false,
  onClick,
  onDelete,
  probability,
  timeframe,
  financialImpact,
}: InsightCardProps) {
  const sev = SEVERITY_CONFIG[severity];
  const typ = TYPE_CONFIG[type];

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.015, y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick?.(id)}
      className={`
        group relative cursor-pointer rounded-2xl p-[1px] transition-all duration-300
        ${sev.glow}
      `}
      role="button"
      tabIndex={0}
      aria-label={`Insight: ${title}`}
      id={`insight-card-${id}`}
    >
      {/* Gradient Border overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

      {/* Card Content with Dynamic Neon Border transition */}
      <div className={`relative rounded-2xl bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 space-y-4 border border-white/[0.05] ${sev.borderNeon} transition-all duration-500`}>

        {/* ── Header Row ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Type Icon */}
            <span className="text-xl flex-shrink-0" aria-hidden="true">{typ.icon}</span>

            {/* Type Label */}
            <span className={`text-xs font-semibold uppercase tracking-wider ${typ.accent}`}>
              {typ.label}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id, e);
                }}
                className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors mr-1 z-10"
                aria-label="Apagar Insight"
                title="Apagar insight"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            )}

            {/* Unread Indicator */}
            {!isRead && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-2 h-2 rounded-full ${sev.dotColor}`}
                aria-label="Não lido"
              />
            )}

            {/* Severity Badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                ${sev.bg} ${sev.color} ${sev.border} border
                ${severity === "CRITICAL" ? "animate-pulse-glow" : ""}
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sev.barColor}`} />
              {sev.label}
            </motion.span>
          </div>
        </div>

        {/* ── Title ── */}
        <h3 className="text-base sm:text-lg font-bold leading-snug text-white/90 group-hover:text-white transition-colors line-clamp-2">
          {title}
        </h3>

        {/* ── Predictive Metrics (If provided) ── */}
        {(probability !== undefined || timeframe || financialImpact) && (
          <div className="grid grid-cols-3 gap-4 py-2 border-y border-white/[0.03] select-none text-[10px] font-medium">
            {probability !== undefined && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Chance de Ocorrência</span>
                <span className="font-bold text-cyan-400 font-mono text-xs">{Math.round(probability * 100)}%</span>
              </div>
            )}
            {timeframe && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Prazo para Agir</span>
                <span className="font-bold text-violet-400 font-mono text-xs">{timeframe}</span>
              </div>
            )}
            {financialImpact && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Economia / Custo</span>
                <span className={`font-bold font-mono text-xs ${financialImpact.startsWith("+") ? "text-emerald-400 font-extrabold" : "text-red-400"}`}>
                  {financialImpact}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Summary ── */}
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
          {summary}
        </p>

        {/* ── Recommendation (if exists) ── */}
        {recommendation && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03] group-hover:border-white/[0.06] transition-colors">
            <span className="text-emerald-400 text-sm mt-0.5">💡</span>
            <p className="text-xs text-emerald-300/80 leading-relaxed line-clamp-2 font-medium">
              {recommendation}
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
          {/* Tags */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {Array.from(new Set(tags)).slice(0, 3).map((tag, index) => (
              <motion.span
                key={`${tag}-${index}`}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.12)" }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/[0.03] text-zinc-400 border border-white/[0.05] truncate max-w-[100px] transition-colors select-none"
              >
                {tag}
              </motion.span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-zinc-500 font-medium">+{tags.length - 3}</span>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3">
            {/* Confidence */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${sev.barColor}`}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 font-medium">
                {formatConfidence(confidence)}
              </span>
            </div>

            {/* Timestamp */}
            <time className="text-[10px] text-zinc-500 font-mono" dateTime={createdAt}>
              {formatRelativeTime(createdAt)}
            </time>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
