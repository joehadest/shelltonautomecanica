"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  applyMask,
  maskInputMode,
  type MaskKind,
} from "@/lib/masks";
import { cn } from "@/lib/utils";

export interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: MaskKind;
  value: string;
  onValueChange: (value: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    {
      mask,
      value,
      onValueChange,
      className,
      type = "text",
      inputMode,
      maxLength,
      ...props
    },
    ref
  ) => {
    const defaults: Partial<Record<MaskKind, number>> = {
      phone: 15,
      placa: 8,
      cnpj: 18,
      time: 5,
    };

    return (
      <Input
        ref={ref}
        type={type}
        inputMode={inputMode ?? maskInputMode(mask)}
        maxLength={maxLength ?? defaults[mask]}
        className={cn(mask === "placa" && "uppercase", className)}
        value={value}
        onChange={(e) => onValueChange(applyMask(mask, e.target.value))}
        {...props}
      />
    );
  }
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
