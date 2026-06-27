"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, CalendarCheck } from "lucide-react";
import { Logo } from "./logo";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/fila", label: "Fila ao vivo" },
  { href: "/agendamento", label: "Agendar" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/#servicos") return false;
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full max-w-full overflow-x-clip border-b transition-all duration-300",
        scrolled
          ? "border-border/80 bg-background/85 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-md"
      )}
    >
      {/* fio vermelho no topo */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl 3xl:max-w-[1700px] items-center justify-between px-4 transition-all duration-300",
          scrolled ? "h-16" : "h-20"
        )}
      >
        <Link
          href="/"
          aria-label="Página inicial"
          className="group min-w-0 shrink transition-transform active:scale-95"
        >
          <Logo withText={false} className="flex sm:hidden [&_img]:group-hover:scale-105" />
          <Logo className="hidden sm:flex [&_img]:group-hover:scale-105" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-0.5 origin-center rounded-full bg-primary transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/agendamento"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "group")}
          >
            <CalendarCheck className="transition-transform group-hover:scale-110" />
            Agendar agora
          </Link>
        </div>

        <button
          className="press-effect inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl 3xl:max-w-[1700px] flex-col gap-1 px-4 py-3">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/agendamento"
              onClick={() => setOpen(false)}
              className="press-effect mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              <CalendarCheck className="size-4" />
              Agendar agora
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
