import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell min-h-full w-full min-w-0 max-w-full overflow-x-hidden">
      {children}
    </div>
  );
}
