"use client";

/**
 * B2B Data Broker — Sidebar Navigation
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "◆" },
  { href: "/dashboard/insights", label: "Insights", icon: "◈" },
  { href: "/dashboard/chat", label: "Chat IA", icon: "◉" },
  { href: "/dashboard/agents", label: "Agentes", icon: "⚙" },
  { href: "/dashboard/reports", label: "Relatórios", icon: "▤" },
  { href: "/dashboard/settings", label: "Configurações", icon: "⊞" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] flex flex-col glass border-r border-white/[0.06]">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <filter id="logo-glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle cx="16" cy="16" r="13" stroke="url(#logo-grad)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
            <path d="M7 16C7 11.0294 11.0294 7 16 7C20.9706 7 25 11.0294 25 16" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 25C11.0294 25 7 20.9706 7 16" stroke="url(#logo-grad)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
            <circle cx="16" cy="16" r="4.5" fill="url(#logo-grad)" filter="url(#logo-glow)" />
          </svg>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Atlas</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href} className="block select-none" prefetch={true}>
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer
                  ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-white/[0.04] border border-white/[0.08] shadow-[0_0_20px_rgba(255,255,255,0.015)]"
                    transition={{ type: "spring", stiffness: 550, damping: 38 }}
                  />
                )}
                <span className={`relative z-10 text-xs transition-colors duration-150 ${isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "opacity-60"}`}>
                  {item.icon}
                </span>
                <span className="relative z-10 tracking-wide">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Agent Status Indicator */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Agentes ativos</span>
        </div>
      </div>
    </aside>
  );
}
