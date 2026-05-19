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
  { href: "/dashboard/competitors", label: "Concorrentes", icon: "⬡" },
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
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
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "text-white bg-white/[0.08] border border-white/[0.08]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="text-xs opacity-60">{item.icon}</span>
                {item.label}
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
