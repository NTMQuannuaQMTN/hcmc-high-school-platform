import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/providers'
import { Navbar } from '@/components/shared/navbar'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'HCMC High School Navigator',
  description: 'Tìm trường THPT phù hợp tại TP.HCM dựa trên điểm thi vào lớp 10',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  )
}
