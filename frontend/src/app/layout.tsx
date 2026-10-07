import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kamano — Digital Trust Infrastructure",
  description:
    "Offline forensic document verification and reusable W3C trust credentials. Data stays in South Africa (af-south-1).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <span className="text-xl font-extrabold text-kamano">Kamano</span>
            <span className="text-xs font-medium text-slate-500">
              Data region: af-south-1
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
