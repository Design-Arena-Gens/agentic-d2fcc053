import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daraz Ice Roller Report",
  description: "Automated analysis of ice roller pricing on Daraz Bangladesh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
