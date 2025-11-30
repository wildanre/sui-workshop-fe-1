import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Workshop SUI - Frontend",
    template: "%s | Workshop SUI",
  },
  description:
    "Interactive workshop for building decentralized applications on the SUI blockchain. Learn to create modern Web3 frontends with Next.js and SUI dApp Kit.",

  authors: [
    {
      name: "Workshop SUI Team",
    },
  ],
  creator: "Workshop SUI Team",
  publisher: "Workshop SUI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground bg-grid min-h-screen">
        <Providers>
          <main className="mx-2 sm:mx-8 md:mx-16 lg:mx-28 xl:mx-28 my-32">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
