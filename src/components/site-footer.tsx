"use client";

import { useDB } from "@/lib/store";
import { resolveFooter } from "@/lib/footer-defaults";
import { FooterTapedDesign } from "@/components/ui/footer-taped-design";

export function SiteFooter() {
  const { footer } = useDB();
  const config = resolveFooter(footer);

  return <FooterTapedDesign config={config} />;
}
