"use client";

import { useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = "shellton:notifications";
const SOUND_KEY = "shellton:sound";
const MAX_ITEMS = 50;

let items: AppNotification[] = [];
let soundEnabled = true;
let initialized = false;
let channel: RealtimeChannel | null = null;
const seen = new Set<string>();
const listeners = new Set<() => void>();

const supabase = createClient();

function emit() {
  for (const l of listeners) l();
}

/* ----------------------------- Persistência ---------------------------- */

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      items = JSON.parse(raw) as AppNotification[];
      items.forEach((n) => seen.add(n.id));
    }
    soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    /* ignore */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore */
  }
}

/* -------------------------------- Som ---------------------------------- */

function playBeep() {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + start + dur
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    playTone(880, 0, 0.18);
    playTone(1175, 0.18, 0.22);
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* ignore */
  }
}

/* ----------------------------- Realtime -------------------------------- */

interface AgendamentoRecord {
  id: string;
  cliente_nome?: string;
  modelo?: string;
  servico_nome?: string;
}

function addNotification(n: AppNotification, withAlert: boolean) {
  if (seen.has(n.id)) return;
  seen.add(n.id);
  items = [n, ...items].slice(0, MAX_ITEMS);
  persist();
  emit();
  if (withAlert) {
    playBeep();
    toast(n.title, { description: n.body });
  }
}

function startRealtime() {
  if (channel) return;
  channel = supabase
    .channel("shellton-notify")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "agendamentos" },
      (payload) => {
        const r = payload.new as AgendamentoRecord;
        const modelo = r.modelo ? ` (${r.modelo})` : "";
        const servico = r.servico_nome ? ` · ${r.servico_nome}` : "";
        addNotification(
          {
            id: r.id,
            title: "Novo agendamento",
            body: `${r.cliente_nome ?? "Cliente"}${modelo}${servico}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
          true
        );
      }
    )
    .subscribe();
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  load();
  startRealtime();
}

/* ------------------------------- Store API ----------------------------- */

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

function getServerSnapshot(): AppNotification[] {
  return [];
}

export function useNotifications() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const unread = list.filter((n) => !n.read).length;
  return { items: list, unreadCount: unread };
}

export function markAllRead() {
  items = items.map((n) => ({ ...n, read: true }));
  persist();
  emit();
}

export function clearNotifications() {
  items = [];
  persist();
  emit();
}

/* ------------------------------- Som API ------------------------------- */

function soundSubscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSoundEnabled() {
  return useSyncExternalStore(
    soundSubscribe,
    () => soundEnabled,
    () => true
  );
}

export function setSoundEnabled(value: boolean) {
  soundEnabled = value;
  if (typeof window !== "undefined") {
    localStorage.setItem(SOUND_KEY, value ? "on" : "off");
  }
  emit();
}
