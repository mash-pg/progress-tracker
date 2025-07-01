'use client';

import './globals.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // ローカルストレージからダークモード設定を読み込む
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', String(newMode));
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  return (
    <html lang="ja" className={darkMode ? 'dark' : ''}>
      <body>
        <nav className="bg-blue-700 p-4 text-white flex justify-center space-x-6 dark:bg-blue-900">
          <Link href="/" className="hover:underline text-lg font-medium">
            タスク一覧
          </Link>
          <Link href="/categories" className="hover:underline text-lg font-medium">
            カテゴリ管理
          </Link>
          <Link href="/search" className="hover:underline text-lg font-medium">
            タスク検索
          </Link>
        </nav>
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md z-50"
        >
          {darkMode ? 'ライトモード' : 'ダークモード'}
        </button>
        {children}
      </body>
    </html>
  );
}
