import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TileFlow Cloud — Yapay Zeka ile Zemin Görselleştirme",
  description:
    "Banyo ve oda fotoğraflarınızı yükleyin, yapay zeka ile zemin fayanslarını değiştirin. Gerçek fayans fotoğraflarınızı kullanarak müşterilerinize canlı önizleme sunun.",
  keywords: ["seramik", "fayans", "AI", "yapay zeka", "zemin", "banyo", "mermer"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="theme-premium-soft min-h-screen bg-[var(--home-bg)] text-[var(--home-text)] antialiased">
        {children}
      </body>
    </html>
  );
}
