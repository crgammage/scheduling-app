// Date utility functions

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Add all days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Add padding days from next month to complete the grid
  const endPadding = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function getMonthName(month: number): string {
  return new Date(2000, month, 1).toLocaleString("default", { month: "long" });
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
}
