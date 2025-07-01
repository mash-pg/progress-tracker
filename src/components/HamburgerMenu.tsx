'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
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

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      {/* Hamburger Icon */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 p-3 rounded-full bg-blue-700 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-900 dark:focus:ring-blue-700"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={closeMenu}
        ></div>
      )}

      {/* Menu */}
      <div
        className={`fixed top-0 right-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out dark:bg-gray-900
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100">メニュー</h2>
          <nav className="flex flex-col space-y-4 flex-grow">
            <Link href="/" className="text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400" onClick={closeMenu}>
              タスク一覧
            </Link>
            <Link href="/categories" className="text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400" onClick={closeMenu}>
              カテゴリ管理
            </Link>
            <Link href="/search" className="text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400" onClick={closeMenu}>
              タスク検索
            </Link>
          </nav>
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleDarkMode}
              className="w-full py-2 px-4 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md"
            >
              {darkMode ? 'ライトモード' : 'ダークモード'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
