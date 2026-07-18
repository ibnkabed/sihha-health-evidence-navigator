import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const description = "A privacy-first Arabic health evidence navigator for wearable, lab, and supplement data.";
  return {
    metadataBase: base,
    title: "صحة | Sihha",
    description,
    openGraph: {
      title: "صحة | Sihha — Health Evidence Navigator",
      description: "Turn scattered wearable, lab, and supplement data into an explainable brief for your next clinical conversation.",
      type: "website",
      images: [{ url: new URL("/og-v2.png", base).toString(), width: 1672, height: 941, alt: "Sihha health evidence navigator" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "صحة | Sihha — Health Evidence Navigator",
      description,
      images: [new URL("/og-v2.png", base).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
