import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
  size = "md",
}: {
  className?: string;
  withText?: boolean;
  /** md = header · lg = hero */
  size?: "md" | "lg";
}) {
  const imageSize = size === "lg" ? 72 : 56;

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Image
        src="/shellton-logo.png"
        alt="Shellton Auto Mecânica"
        width={imageSize}
        height={imageSize}
        className={cn(
          "shrink-0 object-contain transition-transform",
          size === "lg" ? "size-[72px]" : "size-14"
        )}
        priority={size === "lg"}
      />
      {withText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-extrabold tracking-tight text-foreground",
              size === "lg" ? "text-2xl sm:text-3xl" : "text-base"
            )}
          >
            SHELLTON
          </span>
          <span
            className={cn(
              "font-semibold uppercase tracking-[0.25em] text-primary",
              size === "lg" ? "text-xs sm:text-sm" : "text-[10px]"
            )}
          >
            Auto Mecânica
          </span>
        </span>
      )}
    </span>
  );
}
