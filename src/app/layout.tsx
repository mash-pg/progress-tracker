import { createClient } from '@/lib/supabase/server'
import './globals.css';
import NavBar from '@/components/NavBar';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="ja">
      <head>
        <title>進捗管理アプリ</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <NavBar user={user} />
        {children}
      </body>
    </html>
  );
}
