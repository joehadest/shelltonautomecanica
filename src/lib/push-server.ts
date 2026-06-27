import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@shellton.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "Chaves VAPID ausentes. Defina NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY."
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Envia uma notificação para todas as inscrições salvas.
 * Remove automaticamente inscrições expiradas (404/410).
 */
export async function sendPushToAll(payload: PushPayload): Promise<{
  sent: number;
  removed: number;
  total: number;
}> {
  ensureConfigured();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error) throw error;
  const subs = (data as SubscriptionRow[]) ?? [];

  const body = JSON.stringify(payload);
  let sent = 0;
  const expiredIds: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
        sent++;
      } catch (err: unknown) {
        const statusCode =
          typeof err === "object" && err !== null && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(sub.id);
        } else {
          console.error("Erro ao enviar push:", err);
        }
      }
    })
  );

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return { sent, removed: expiredIds.length, total: subs.length };
}
