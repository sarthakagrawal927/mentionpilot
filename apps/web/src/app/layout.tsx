import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AnalyticsProvider } from "@/components/posthog-provider";
import { SaaSMakerFeedback } from "@/components/saasmaker-feedback";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mention.highsignal.app"),
  title: "MentionPilot",
  description: "AI Visibility Monitoring for Startups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              'var __name = (target, value) => Object.defineProperty(target, "name", { value, configurable: true });',
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            {children}
            <SaaSMakerFeedback />
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
