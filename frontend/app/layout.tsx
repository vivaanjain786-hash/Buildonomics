import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "RouteX — Cross-Chain Execution Intelligence",
  description: "Provider-neutral intelligence for risk-aware, explainable cross-chain execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              try {
                var root = document.documentElement;
                var theme = localStorage.getItem("routex-theme");
                if (theme !== "dark" && theme !== "light") theme = "light";
                root.dataset.theme = theme;
                root.style.colorScheme = theme;
              } catch (_) {
                document.documentElement.dataset.theme = "light";
                document.documentElement.style.colorScheme = "light";
              }
            })();`,
          }}
        />
      </head>
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  );
}
