'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react'; // ハンバーガーアイコン

export default function NavBar({ user }: { user: any }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
      {/* モバイル表示時のハンバーガーメニュー */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-white dark:bg-gray-900">
            <div className="p-6 flex flex-col h-full">
              <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100">メニュー</h2>
              <nav className="flex flex-col space-y-4 flex-grow">
                {user ? (
                  <>
                    <p className="text-gray-800 dark:text-gray-100 mb-4">ようこそ、{user.user_metadata.username || user.email}さん</p>
                    <Link href="/" className="text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400" onClick={() => setIsSheetOpen(false)}>
                      タスク一覧
                    </Link>
                    <Link href="/search" className="text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400" onClick={() => setIsSheetOpen(false)}>
                      タスク検索
                    </Link>
                    <Link href="/categories" className="text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400" onClick={() => setIsSheetOpen(false)}>
                      カテゴリ管理
                    </Link>
                    <form action="/auth/signout" method="post" className="mt-4">
                      <Button type="submit" variant="ghost" className="w-full justify-start text-lg font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600" onClick={() => setIsSheetOpen(false)}>ログアウト</Button>
                    </form>
                  </>
                ) : (
                  <Link href="/login" className="text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400" onClick={() => setIsSheetOpen(false)}>
                    ログイン
                  </Link>
                )}
              </nav>
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={toggleDarkMode}
                  className="w-full"
                >
                  {darkMode ? 'ライトモード' : 'ダークモード'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* デスクトップ表示時のユーザー情報とダークモード切り替え（左端に移動） */}
      <div className="hidden md:flex items-center">
        {user ? (
          <div className="flex items-center">
            <span className="mr-4">{user.user_metadata.username || user.email}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="link" className="text-white hover:no-underline">ログアウト</Button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="hover:underline">
            ログイン
          </Link>
        )}
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          className="ml-6 bg-white text-black"
        >
          {darkMode ? 'ライトモード' : 'ダークモード'}
        </Button>
      </div>
      {/* デスクトップ表示時のナビゲーションリンク（右端に移動） */}
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
    </nav>
  );
}