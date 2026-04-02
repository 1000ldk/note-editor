import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";

const notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoteIdeaMapper",
  description: "noteクリエイターのためのアイデア整理・統合ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} bg-surface text-on-surface antialiased min-h-screen selection:bg-primary/10 flex`}>
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative w-full h-[100dvh]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
