import type { Metadata, Viewport } from "next";
import { AdminDesktopViewport } from "@/components/admin/admin-desktop-viewport";

export const metadata: Metadata = {
  title: "Admin",
};

/** Viewport otimizado para ~720px (mobile legível, cards e abas confortáveis). */
export const viewport: Viewport = {
  width: 720,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminDesktopViewport />
      <div className="admin-shell">{children}</div>
    </>
  );
}
