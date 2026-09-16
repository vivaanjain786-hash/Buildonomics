import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RouteX â€” Ethereum Execution OS",
  description: "Execution and intelligence layer for Ethereum's fragmented L1/L2 ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
