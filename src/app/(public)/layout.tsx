import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      <SiteFooter />
    </>
  );
}
