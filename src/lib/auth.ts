"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

let isAuthenticated = false;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  supabase.auth.getSession().then(({ data: { session } }) => {
    isAuthenticated = !!session;
    emit();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    isAuthenticated = !!session;
    emit();
  });
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth() {
  const authed = useSyncExternalStore(
    subscribe,
    () => isAuthenticated,
    () => false
  );
  return { isAuthenticated: authed };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    return { ok: false, error: "E-mail ou senha inválidos." };
  }
  return { ok: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}
