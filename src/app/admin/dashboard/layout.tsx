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
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden [&_a]:cursor-pointer [&_button]:cursor-pointer [&_label:has(input[type=checkbox])]:cursor-pointer [&_select]:cursor-pointer">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex h-14 w-full min-w-0 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-4 3xl:max-w-[1920px]">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo className="gap-2 [&_img]:size-9 sm:[&_img]:size-14 [&>span:last-child]:hidden sm:[&>span:last-child]:flex" />
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary sm:px-2.5 sm:text-xs">
              Admin
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationsBell />
            <Link
              href="/"
              target="_blank"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md p-2 text-sm text-muted-foreground hover:text-foreground sm:px-3 sm:py-2"
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
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden bg-background">
        {children}
      </main>
    </div>
  );
}
