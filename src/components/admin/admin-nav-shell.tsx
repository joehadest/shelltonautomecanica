"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_MOBILE_MORE,
  ADMIN_MOBILE_PRIMARY,
  ADMIN_NAV,
  isAdminMoreTab,
  type AdminTab,
} from "@/components/admin/admin-nav";

type BadgeMap = Partial<Record<AdminTab, number>>;

type AdminNavShellProps = {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  badges?: BadgeMap;
  children: React.ReactNode;
};

function NavBadge({
  count,
  active,
  className,
}: {
  count: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
        active
          ? "bg-primary-foreground text-primary"
          : "bg-primary text-primary-foreground",
        className
      )}
    >
      {count}
    </span>
  );
}

export function AdminNavShell({
  tab,
  onTabChange,
  badges = {},
  children,
}: AdminNavShellProps) {
  const reduceMotion = useReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = isAdminMoreTab(tab);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  function selectTab(id: AdminTab) {
    onTabChange(id);
    setMoreOpen(false);
  }

  const activeLabel =
    ADMIN_NAV.find((t) => t.id === tab)?.label ?? "Painel";

  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      {/* Sidebar — desktop: fixa; só o conteúdo principal rola */}
      <aside className="z-20 hidden h-full w-60 shrink-0 flex-col border-r border-white/[0.06] bg-black/20 backdrop-blur-xl lg:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Navegação
          </p>
          {ADMIN_NAV.map((item) => {
            const active = tab === item.id;
            const badge = badges[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={cn(
                  "group relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(239,68,68,0.25)]"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                )}
                <item.icon
                  className={cn(
                    "size-[18px] shrink-0 transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-left">
                  {item.label}
                </span>
                {badge != null && badge > 0 && (
                  <NavBadge count={badge} active={active} />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Conteúdo — único painel com scroll vertical */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-4 sm:py-8 lg:pb-8 3xl:max-w-[1920px]">
          {tab !== "documentos" && <div className="mb-5 min-w-0 sm:mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              Admin
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {activeLabel}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Controle agendamentos, fila e portfólio em tempo real.
            </p>
          </div>}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              className="min-w-0 max-w-full"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, y: -6 }
              }
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav — mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-black/75 backdrop-blur-2xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegação principal"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
          {ADMIN_MOBILE_PRIMARY.map((item) => {
            const active = tab === item.id;
            const badge = badges[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={cn(
                  "relative flex min-h-11 min-w-[3.5rem] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && (
                  <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                )}
                <span className="relative">
                  <item.icon className="size-5" />
                  {badge != null && badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5">
                      <NavBadge count={badge} />
                    </span>
                  )}
                </span>
                <span className="leading-none">{item.shortLabel}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex min-h-11 min-w-[3.5rem] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors",
              moreActive || moreOpen
                ? "text-primary"
                : "text-muted-foreground"
            )}
            aria-expanded={moreOpen}
            aria-label="Mais opções"
          >
            {(moreActive || moreOpen) && (
              <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
            )}
            <MoreHorizontal className="size-5" />
            <span className="leading-none">Mais</span>
          </button>
        </div>
      </nav>

      {/* Sheet "Mais" — mobile */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/[0.08] bg-[#0e0e11]/95 p-4 shadow-2xl backdrop-blur-xl"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
              initial={reduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              role="dialog"
              aria-label="Mais seções"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Mais seções
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Configuração e conteúdo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_MOBILE_MORE.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all",
                        active
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-white/[0.06] bg-white/[0.03] text-foreground hover:border-primary/25 hover:bg-white/[0.05]"
                      )}
                    >
                      <item.icon className="size-5 shrink-0" />
                      <span className="leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
