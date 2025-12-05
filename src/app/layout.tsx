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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "State of Code Survey",
    description: "Annual survey exploring how developers use AI coding tools and agents.",
    type: "website",
    siteName: "State of Code",
  },
  twitter: {
    card: "summary_large_image",
    title: "State of Code Survey",
    description: "Annual survey exploring how developers use AI coding tools and agents.",
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
