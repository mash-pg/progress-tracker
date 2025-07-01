'use client';

import './globals.css';
import HamburgerMenu from '@/components/HamburgerMenu'; // HamburgerMenuをインポート

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <HamburgerMenu />
        {children}
      </body>
    </html>
  );
}
