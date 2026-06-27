"use client";

import {
  subscribeUser,
  unsubscribeUser,
  type SerializedSubscription,
} from "@/app/admin/push-actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in window)
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

function serialize(sub: PushSubscription): SerializedSubscription {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

export async function enablePush(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (!isPushSupported()) {
    return { ok: false, reason: "Este navegador não suporta notificações push." };
  }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, reason: "Chave VAPID pública não configurada." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "Permissão de notificação negada." };
  }

  await registerServiceWorker();
  const reg = await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const result = await subscribeUser(serialize(sub), navigator.userAgent);
  if (!result.success) {
    return { ok: false, reason: result.error ?? "Falha ao salvar inscrição." };
  }
  return { ok: true };
}

export async function disablePush(): Promise<void> {
  const sub = await getCurrentSubscription();
  if (sub) {
    await unsubscribeUser(sub.endpoint);
    await sub.unsubscribe();
  }
}
