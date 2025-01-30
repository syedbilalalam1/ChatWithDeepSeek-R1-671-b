import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DeepSeek R1 Chat | by Syed Bilal Alam",
  description: "Experience the power of DeepSeek's R1 model - a state-of-the-art open-source LLM that rivals GPT-4!",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        href: "/favicon.ico",
      }
    ],
  },
  authors: [
    {
      name: "Syed Bilal Alam",
      url: "https://github.com/syedbilalalam1",
    }
  ],
  keywords: [
    "DeepSeek",
    "R1",
    "AI",
    "Chat",
    "LLM",
    "GPT",
    "OpenRouter",
    "Next.js",
    "React",
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TooltipProvider delayDuration={0}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}



import './globals.css'
