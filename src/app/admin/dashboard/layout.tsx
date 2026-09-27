"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LogOut, ExternalLink, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/admin/notifications-bell";
import { signOut, useAuth } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Aguarda 1 tick para o store de auth ler o localStorage.
    const t = setTimeout(() => {
      setChecked(true);
      if (!isAuthenticated) router.replace("/admin/login");
    }, 50);
    return () => clearTimeout(t);
  }, [isAuthenticated, router]);

  if (!checked || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  async function handleLogout() {
    await signOut();
    toast.success("Sessão encerrada.");
    router.replace("/admin/login");
  }

  return (
    <div className="flex h-screen min-h-0 min-w-0 max-w-full flex-col overflow-hidden supports-[height:100dvh]:h-dvh [&_a]:cursor-pointer [&_button]:cursor-pointer [&_label:has(input[type=checkbox])]:cursor-pointer [&_select]:cursor-pointer">
      <header className="z-30 shrink-0 border-b border-white/[0.06] bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full min-w-0 max-w-[100rem] items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo className="gap-2 [&_img]:size-9 sm:[&_img]:size-12 [&>span:last-child]:hidden sm:[&>span:last-child]:flex" />
            <span className="shrink-0 rounded-lg border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary shadow-[0_0_16px_rgba(239,68,68,0.15)] sm:px-2.5 sm:text-xs">
              Admin
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationsBell />
            <Link
              href="/"
              target="_blank"
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl p-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground sm:min-w-0 sm:px-3 sm:py-2"
              aria-label="Ver site"
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">Ver site</span>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="min-h-0 min-w-0 max-w-full flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
