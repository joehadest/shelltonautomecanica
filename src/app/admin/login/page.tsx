"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-black" />
      <div className="absolute -left-20 top-10 size-72 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute -right-20 bottom-10 size-72 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="size-6" />
            </div>
            <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
            <CardDescription>
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
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

            <div className="mt-5 rounded-md border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Primeiro acesso?</p>
              <p>
                Crie um usuário administrador em{" "}
                <strong>Supabase → Authentication → Users</strong> e use esse
                e-mail e senha para entrar.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
