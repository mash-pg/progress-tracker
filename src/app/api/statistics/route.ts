import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lastDayOfMonth, format, parseISO } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM

  if (!month) {
    return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    const startDate = `${month}-01`;
    const parsedMonth = parseISO(`${month}-01`);
    const endDate = format(lastDayOfMonth(parsedMonth), 'yyyy-MM-dd');

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, app_status, dueDate')
      .gte('dueDate', startDate)
      .lte('dueDate', endDate);

    if (error) {
      console.error('Error fetching tasks for statistics:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Aggregate data by date
    const dailyStats: { [key: string]: { completed: number; total: number } } = {};

    tasks.forEach(task => {
      const date = task.dueDate; // Assuming dueDate is in YYYY-MM-DD format
      if (!dailyStats[date]) {
        dailyStats[date] = { completed: 0, total: 0 };
      }
      dailyStats[date].total++;
      if (task.app_status === 'completed') {
        dailyStats[date].completed++;
      }
    });

    // Convert to array and sort by date
    const statistics = Object.keys(dailyStats).map(date => ({
      date,
      completed: dailyStats[date].completed,
      total: dailyStats[date].total,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(statistics, { status: 200 });

  } catch (error) {
    console.error('Error in statistics API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
