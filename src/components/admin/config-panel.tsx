"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Smartphone,
  ShieldCheck,
  Share,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  enablePush,
  disablePush,
  getCurrentSubscription,
  isPushSupported,
  isStandalone,
  isIOS,
} from "@/lib/push-client";
import { sendTestNotification } from "@/app/admin/push-actions";
import { useSoundEnabled, setSoundEnabled } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function ConfigPanel() {
  const soundEnabled = useSoundEnabled();
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setStandalone(isStandalone());
    setIos(isIOS());
    getCurrentSubscription().then((s) => setSubscribed(!!s));
  }, []);

  async function handleEnable() {
    setLoading(true);
    try {
      const res = await enablePush();
      if (res.ok) {
        setSubscribed(true);
        toast.success("Notificações ativadas neste dispositivo!");
      } else {
        toast.error(res.reason);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    try {
      await disablePush();
      setSubscribed(false);
      toast.info("Notificações desativadas neste dispositivo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await sendTestNotification();
      if (res.success) {
        const sent = "sent" in res ? res.sent : 0;
        toast.success(`Teste enviado para ${sent} dispositivo(s).`);
      } else {
        const err = "error" in res ? res.error : undefined;
        toast.error(err ?? "Falha ao enviar teste.");
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Notificações no celular
          </CardTitle>
          <CardDescription>
            Receba um alerta sempre que chegar um novo agendamento — mesmo com o
            app fechado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!supported ? (
            <p className="rounded-md bg-secondary/50 p-3 text-sm text-muted-foreground">
              Este navegador não suporta notificações push.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      subscribed
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {subscribed ? (
                      <Bell className="size-4" />
                    ) : (
                      <BellOff className="size-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {subscribed ? "Ativadas" : "Desativadas"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      neste dispositivo
                    </p>
                  </div>
                </div>
                {subscribed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisable}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <BellOff />}
                    Desativar
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleEnable} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <Bell />}
                    Ativar
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleTest}
                disabled={testing || !subscribed}
              >
                {testing ? <Loader2 className="animate-spin" /> : <Send />}
                Enviar notificação de teste
              </Button>

              {ios && !standalone && (
                <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <Smartphone className="size-5 shrink-0 text-primary" />
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">
                      No iPhone, instale o app primeiro
                    </p>
                    <p className="mt-1">
                      Toque em <Share className="inline size-3" /> (Compartilhar)
                      e depois em <strong>“Adicionar à Tela de Início”</strong>.
                      Abra pelo ícone instalado e volte aqui para ativar.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Som + dispositivo */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="size-5 text-primary" />
              Som de alerta
            </CardTitle>
            <CardDescription>
              Toca um som quando um agendamento chega com o painel aberto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  {soundEnabled ? (
                    <Volume2 className="size-4" />
                  ) : (
                    <VolumeX className="size-4" />
                  )}
                </span>
                <p className="text-sm font-medium text-foreground">
                  {soundEnabled ? "Som ligado" : "Som desligado"}
                </p>
              </div>
              <Button
                variant={soundEnabled ? "outline" : "default"}
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? "Desligar" : "Ligar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Status do app
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Instalado como app</span>
              <span
                className={cn(
                  "font-medium",
                  standalone ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {standalone ? "Sim" : "Não"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Push suportado</span>
              <span
                className={cn(
                  "font-medium",
                  supported ? "text-emerald-400" : "text-red-400"
                )}
              >
                {supported ? "Sim" : "Não"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
