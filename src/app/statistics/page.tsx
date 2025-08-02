'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DateNavigation from '@/components/DateNavigation';

interface StatisticsData {
  date: string;
  completed: number;
  total: number;
}

export default function StatisticsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedMonth = localStorage.getItem('selectedMonth');
    if (savedMonth) {
      setSelectedMonth(savedMonth);
    } else {
      setSelectedMonth(new Date().toISOString().substring(0, 7));
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchStatistics(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchStatistics = async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/statistics?month=${month}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: StatisticsData[] = await response.json();
      setStatistics(data);
    } catch (e: any) {
      console.error('Failed to fetch statistics:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
  };

  if (selectedMonth === null) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900 flex justify-center items-center">
        <p className="text-xl text-gray-600 dark:text-gray-300">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 dark:bg-gray-800">
        <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 dark:text-gray-100">タスク統計</h1>

        <DateNavigation selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />

        {loading && <p className="text-center text-blue-500 text-lg dark:text-blue-300">統計データを読み込み中...</p>}
        {error && <p className="text-center text-red-500 text-lg dark:text-red-300">エラー: {error}</p>}

        {!loading && !error && statistics.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 dark:text-gray-200">月別タスク完了状況</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={statistics}
                margin={{
                  top: 20, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#8884d8" name="完了タスク" />
                <Bar dataKey="total" stackId="a" fill="#82ca9d" name="総タスク数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          !loading && !error && <p className="text-center text-gray-500 text-lg col-span-full dark:text-gray-400">この月には統計データがありません。</p>
        )}
      </div>
    </div>
  );
}
