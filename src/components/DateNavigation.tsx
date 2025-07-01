'use client';

interface DateNavigationProps {
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
}

export default function DateNavigation({ selectedMonth, onMonthChange }: DateNavigationProps) {
  const handlePrevMonth = () => {
    console.log('handlePrevMonth: Current selectedMonth:', selectedMonth);
    const [year, month] = selectedMonth.split('-').map(Number);
    const currentDate = new Date(year, month - 1, 1); // YYYY-MM-01形式でDateオブジェクトを作成 (月は0-indexed)
    currentDate.setMonth(currentDate.getMonth() - 1); // 1ヶ月前に設定
    const newMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    console.log('handlePrevMonth: New month:', newMonth);
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    console.log('handleNextMonth: Current selectedMonth:', selectedMonth);
    const [year, month] = selectedMonth.split('-').map(Number);
    const currentDate = new Date(year, month - 1, 1); // YYYY-MM-01形式でDateオブジェクトを作成 (月は0-indexed)
    currentDate.setMonth(currentDate.getMonth() + 1); // 1ヶ月後に設定
    const newMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    console.log('handleNextMonth: New month:', newMonth);
    onMonthChange(newMonth);
  };

  return (
    <div className="date-navigation flex justify-between items-center mb-8 p-4 bg-blue-600 text-white rounded-lg shadow-md">
      <button onClick={handlePrevMonth} className="px-5 py-2 bg-blue-700 hover:bg-blue-800 rounded-full transition duration-300 ease-in-out text-lg font-semibold">&lt;&lt; 前月</button>
      <span className="current-date text-2xl font-bold cursor-pointer hover:text-blue-200 transition duration-300 ease-in-out" onClick={() => alert('カレンダーピッカーを表示')}>
        {selectedMonth}
      </span>
      <button onClick={handleNextMonth} className="px-5 py-2 bg-blue-700 hover:bg-blue-800 rounded-full transition duration-300 ease-in-out text-lg font-semibold">翌月 &gt;&gt;</button>
    </div>
  );
}