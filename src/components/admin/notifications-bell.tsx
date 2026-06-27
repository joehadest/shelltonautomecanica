"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2, CalendarClock } from "lucide-react";
import {
  useNotifications,
  markAllRead,
  clearNotifications,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

export function NotificationsBell() {
  const { items, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next && unreadCount > 0) {
        // pequeno atraso para o usuário ver o destaque antes de marcar lido
        setTimeout(() => markAllRead(), 1200);
      }
      return next;
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notificações"
        className="press-effect relative inline-flex size-10 items-center justify-center rounded-md text-foreground hover:bg-secondary"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-[18px] text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notificações</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => markAllRead()}
                title="Marcar todas como lidas"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <CheckCheck className="size-4" />
              </button>
              <button
                onClick={() => clearNotifications()}
                title="Limpar"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell className="size-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação ainda.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id + n.createdAt}
                  className={cn(
                    "flex gap-3 border-b border-border/60 px-4 py-3 last:border-0",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarClock className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {n.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
