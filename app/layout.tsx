import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = { title: "Ai RECORDS Radio Schedule", description: "Live broadcast dashboard for Ai RECORDS radio." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
