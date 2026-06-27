export default function Template({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="animate-page-in">{children}</div>;
}
