"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {children}
      </div>
    </div>,
    document.body
  );
}

function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-card p-6 shadow-xl",
        className
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
      )}
      {children}
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
