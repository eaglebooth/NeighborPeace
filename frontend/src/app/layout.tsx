import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeighborPeace - Civic Dispute Escrow & AI Arbitration",
  description: "GenLayer-native neighborhood noise and litter escrow dispute arbitrator.",
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
