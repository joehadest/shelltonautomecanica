"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToAll } from "@/lib/push-server";

export interface SerializedSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeUser(
  sub: SerializedSubscription,
  userAgent?: string
) {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { success: false, error: "Inscrição inválida." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent ?? null,
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    console.error("subscribeUser:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  if (!endpoint) return { success: false, error: "endpoint ausente" };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function sendTestNotification() {
  try {
    const result = await sendPushToAll({
      title: "Shellton Auto Mecânica",
      body: "Notificação de teste — está tudo funcionando! 🔧",
      url: "/admin/dashboard",
      tag: "shellton-test",
    });
    return { success: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}
