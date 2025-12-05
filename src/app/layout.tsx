import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "State of Code Survey | stateofcode.ai",
  description: "Annual survey exploring how developers use AI coding tools and agents. Help shape the future of developer tools.",
  keywords: ["AI coding", "developer survey", "AI tools", "software development", "programming"],
  authors: [{ name: "Devographics" }],
  metadataBase: new URL('https://stateofcode.ai'),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "State of Code Survey 2025",
    description: "Annual survey exploring how developers use AI coding tools and agents.",
    type: "website",
    siteName: "State of Code",
    url: "https://stateofcode.ai",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "State of Code 2025 - Annual developer survey on AI coding tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "State of Code Survey 2025",
    description: "Annual survey exploring how developers use AI coding tools and agents.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
