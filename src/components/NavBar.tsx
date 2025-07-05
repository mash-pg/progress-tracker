'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HamburgerMenu from '@/components/HamburgerMenu';

export default function NavBar({ user }: { user: any }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 開発環境でのみ特定の警告を抑制
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('Support for defaultProps will be removed from memo components')) {
          return; // この警告は無視する
        }
        originalError.apply(console, args);
      };
      return () => {
        console.error = originalError; // クリーンアップ関数で元に戻す
      };
    }
  }, []); // マウント時に一度だけ実行

  useEffect(() => {
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
    <nav className="bg-blue-700 p-4 text-white flex justify-between items-center dark:bg-blue-900">
      <div className="md:hidden">
        <HamburgerMenu user={user} />
      </div>
      <div className="hidden md:flex items-center">
        {user && (
          <>
            <Link href="/" className="hover:underline text-lg font-medium">
              タスク一覧
            </Link>
            <Link href="/categories" className="hover:underline text-lg font-medium ml-4">
              カテゴリ管理
            </Link>
            <Link href="/search" className="hover:underline text-lg font-medium ml-4">
              タスク検索
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center">
        {user ? (
          <div className="flex items-center">
            <span className="mr-4">{user.user_metadata.username || user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="hover:underline">ログアウト</button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="hover:underline">
            ログイン
          </Link>
        )}
        <button
          onClick={toggleDarkMode}
          className="ml-6 p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md"
        >
          {darkMode ? 'ライトモード' : 'ダークモード'}
        </button>
      </div>
    </nav>
  );
}