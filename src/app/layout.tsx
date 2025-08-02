import { createClient } from '@/lib/supabase/server'
import './globals.css';
import NavBar from '@/components/NavBar';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <title>進捗管理アプリ</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
