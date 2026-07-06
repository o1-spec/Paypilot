import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4F46E5",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: {
    default: "PayPilot — Dedicated Virtual Accounts for Nigerian Businesses",
    template: "%s | PayPilot",
  },
  description:
    "PayPilot helps businesses assign dedicated Nomba virtual account numbers to customers, track bank transfers, and automatically reconcile payments — no manual matching required.",
  keywords: [
    "virtual account",
    "payment reconciliation",
    "Nigerian fintech",
    "Nomba",
    "SME payments",
    "invoicing",
    "bank transfer matching",
    "PayPilot",
  ],
  authors: [{ name: "PayPilot", url: "https://paypilot.co" }],
  creator: "PayPilot",
  publisher: "PayPilot",
  metadataBase: new URL("https://paypilot.co"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://paypilot.co",
    siteName: "PayPilot",
    title: "PayPilot — Dedicated Virtual Accounts for Nigerian Businesses",
    description:
      "Assign account numbers to customers, track transfers, and reconcile payments automatically using Nomba's virtual account infrastructure.",
  },
  twitter: {
    card: "summary",
    title: "PayPilot — Virtual Account Reconciliation",
    description:
      "Automatic payment reconciliation for Nigerian SMEs, built on Nomba's virtual account infrastructure.",
    creator: "@paypilot_hq",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
