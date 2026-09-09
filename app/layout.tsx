import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zezhao-wang-career.zedwang.chatgpt.site"),
  title: "ZEZHAO WANG · Research & Data Analyst",
  description: "AI evaluation, user and customer insights, multilingual measurement, and applied data analysis from Helsinki.",
  openGraph: {
    title: "ZEZHAO WANG · Research & Data Analyst",
    description: "AI Evaluation · User & Customer Insights · Measurement",
    type: "profile",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ZEZHAO WANG · Evidence into useful decisions" }],
  },
  twitter: { card: "summary_large_image", title: "ZEZHAO WANG · Research & Data Analyst", description: "AI Evaluation · User & Customer Insights · Measurement", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
