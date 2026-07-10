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
    <div className="flex min-h-screen flex-col [&_a]:cursor-pointer [&_button]:cursor-pointer [&_label:has(input[type=checkbox])]:cursor-pointer [&_select]:cursor-pointer">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-7xl 3xl:max-w-[1920px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Link
              href="/"
              target="_blank"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
              <span>Ver site</span>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}
