import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-white/10 text-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/15 text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/15 text-amber-400",
        info: "border-sky-500/20 bg-sky-500/15 text-sky-400",
        danger: "border-red-500/20 bg-red-500/15 text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
