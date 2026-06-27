import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Shellton Auto Mecânica | Oficina especializada",
    template: "%s | Shellton Auto Mecânica",
  },
  description:
    "Oficina mecânica completa: troca de óleo, alinhamento, motor, elétrica e mais. Agende seu serviço e acompanhe a fila em tempo real.",
  keywords: [
    "oficina mecânica",
    "Shellton",
    "troca de óleo",
    "alinhamento",
    "agendamento",
  ],
  icons: {
    icon: [
      { url: "/favicon/favicon-for-app/icon1.png", type: "image/png" },
      { url: "/favicon/favicon-for-app/icon0.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/favicon/favicon-for-app/manifest.json",
  appleWebApp: {
    title: "Shellton",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full max-w-full overflow-x-clip flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
