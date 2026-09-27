"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { Loader2, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { signIn, useAuth } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isAuthenticated) router.replace("/admin/dashboard");
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Bem-vindo de volta!");
      router.replace("/admin/dashboard");
    } else {
      toast.error(res.error ?? "Falha no login.");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[#050506]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(239,68,68,0.28),transparent_55%)]" />
      <div className="absolute -left-24 top-1/4 size-[28rem] rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 size-[22rem] rounded-full bg-primary/10 blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        className="relative w-full max-w-md"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="press-effect">
            <Logo size="lg" />
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90">
            Acesso restrito
          </p>
        </div>

        <Card className="admin-glow-ring overflow-hidden border-white/[0.08] bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <CardHeader className="relative text-center">
            <motion.div
              className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-[0_0_32px_rgba(239,68,68,0.25)]"
              initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.4 }}
            >
              <Lock className="size-6" />
            </motion.div>
            <CardTitle className="text-2xl tracking-tight">
              Painel Administrativo
            </CardTitle>
            <CardDescription className="text-balance">
              Acesso restrito ao dono/gerente da oficina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@shellton.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-white/[0.08] bg-white/[0.03] focus-visible:border-primary/40 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-white/[0.08] bg-white/[0.03] focus-visible:border-primary/40 focus-visible:ring-primary/30"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full shadow-[0_0_28px_rgba(239,68,68,0.3)]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <ShieldCheck />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.03] p-3.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Primeiro acesso?</p>
              <p className="mt-1 leading-relaxed">
                Crie um usuário administrador em{" "}
                <strong>Supabase → Authentication → Users</strong> e use esse
                e-mail e senha para entrar.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-7 text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Voltar ao site
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
