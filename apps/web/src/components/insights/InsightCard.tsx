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
}

// ── Visual Maps ──
const SEVERITY_CONFIG = {
  LOW: {
    label: "Baixo",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.12)]",
    barColor: "bg-cyan-400",
    dotColor: "bg-cyan-400",
  },
  MEDIUM: {
    label: "Médio",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    glow: "shadow-[0_0_20px_rgba(167,139,250,0.12)]",
    barColor: "bg-violet-400",
    dotColor: "bg-violet-400",
  },
  HIGH: {
    label: "Alto",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    glow: "shadow-[0_0_25px_rgba(251,191,36,0.15)]",
    barColor: "bg-amber-400",
    dotColor: "bg-amber-400",
  },
  CRITICAL: {
    label: "Crítico",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    glow: "shadow-[0_0_30px_rgba(248,113,113,0.2)]",
    barColor: "bg-red-400",
    dotColor: "bg-red-400 animate-pulse",
  },
} as const;

const TYPE_CONFIG = {
  RISK_ALERT: { label: "Alerta de Risco", icon: "🛡️", accent: "text-red-400" },
  OPPORTUNITY: { label: "Oportunidade", icon: "🎯", accent: "text-emerald-400" },
  TREND: { label: "Tendência", icon: "📈", accent: "text-blue-400" },
  COMPETITIVE_MOVE: { label: "Mov. Competitivo", icon: "⚔️", accent: "text-amber-400" },
  REGULATORY_CHANGE: { label: "Regulatório", icon: "📋", accent: "text-violet-400" },
} as const;

// ── Animation Variants ──
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
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
}: InsightCardProps) {
  const sev = SEVERITY_CONFIG[severity];
  const typ = TYPE_CONFIG[type];

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      onClick={() => onClick?.(id)}
      className={`
        group relative cursor-pointer rounded-2xl p-[1px] transition-all duration-300
        ${sev.glow}
        hover:shadow-lg
      `}
      role="button"
      tabIndex={0}
      aria-label={`Insight: ${title}`}
      id={`insight-card-${id}`}
    >
      {/* Gradient Border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.03] pointer-events-none" />

      {/* Card Content */}
      <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 space-y-4 border border-white/[0.06] group-hover:border-white/[0.12] transition-colors duration-300">

        {/* ── Header Row ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Type Icon */}
            <span className="text-xl flex-shrink-0" aria-hidden="true">{typ.icon}</span>

            {/* Type Label */}
            <span className={`text-xs font-medium uppercase tracking-wider ${typ.accent}`}>
              {typ.label}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
              transition={{ delay: 0.2 }}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest
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
        <h3 className="text-base sm:text-lg font-semibold leading-snug text-white/95 group-hover:text-white transition-colors line-clamp-2">
          {title}
        </h3>

        {/* ── Summary ── */}
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
          {summary}
        </p>

        {/* ── Recommendation (if exists) ── */}
        {recommendation && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="text-emerald-400 text-sm mt-0.5">💡</span>
            <p className="text-xs text-emerald-300/80 leading-relaxed line-clamp-2">
              {recommendation}
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          {/* Tags */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06] truncate max-w-[100px]"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-zinc-500">+{tags.length - 3}</span>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3">
            {/* Confidence */}
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  className={`h-full rounded-full ${sev.barColor}`}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {formatConfidence(confidence)}
              </span>
            </div>

            {/* Timestamp */}
            <time className="text-[10px] text-zinc-600 font-mono" dateTime={createdAt}>
              {formatRelativeTime(createdAt)}
            </time>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
