// @app/loyout.tsx
import { Footer } from "@/components/common/footer";
import { Header } from "@/components/common/header";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProviders } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veritas — Source & Citation Verification for Academics",
  description:
    "Document forensics for the AI era. Verify citations, ISBNs, DOIs, and author IRIs, and see the whole reference graph at a glance.",
  openGraph: {
    title: "Veritas — Source & Citation Verification for Academics",
    description:
      "Tactical document forensics: check whether references, books, and citations actually exist.",
    type: "website",
    images: [
      {
        url: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/39914075-cb99-4dc2-ba44-75ca82a357cb/id-preview-72f38fcd--5d91b369-aaf5-4e66-960f-7fda953da8ee.lovable.app-1782897328545.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProviders>
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              {children}
              <Footer />
            </div>
          </TooltipProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
