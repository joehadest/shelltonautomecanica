export default function Template({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="animate-page-in w-full min-w-0 overflow-x-clip">{children}</div>;
}
