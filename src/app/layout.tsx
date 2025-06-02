import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { ThemeProvider } from '../components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EasyPanel Monitor',
  description: 'Monitor your EasyPanel servers with privacy-friendly local storage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const settings = JSON.parse(localStorage.getItem('easypanel_monitor_settings') || '{"colorMode":"system"}');
                const colorMode = settings.colorMode || 'system';
                
                if (colorMode === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (colorMode === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  // System preference
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch (e) {
                // Default to system preference if settings are corrupted
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                }
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-background">
            <header className="border-b">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="text-2xl font-bold hover:text-gray-700 dark:hover:text-gray-300">
                    EasyPanel Monitor
                  </Link>
                  <Link 
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </Link>
                </div>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
} 