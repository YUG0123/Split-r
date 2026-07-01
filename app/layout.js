import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ui/convex-client-provider";
import Header from "@/components/ui/header";
import { ClerkProvider } from "@clerk/nextjs";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "splitr",
  description: "split expenses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logos/logo2.png" sizes="any"/>
      </head>
      
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <ClerkProvider>
        <ConvexClientProvider>

          <Header />

          <main className="min-h-screen">
            {children}
          </main>
        </ConvexClientProvider> 
        </ClerkProvider>
      </body>
    </html>
  );
}