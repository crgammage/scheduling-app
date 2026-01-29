"use client";

import { useState, useMemo } from "react";
import { getMonthDays, getMonthName, isSameMonth, formatDate } from "@/lib/utils";
import { DayCell } from "./DayCell";
import { DateModal } from "./DateModal";
import { Doc } from "../../../convex/_generated/dataModel";

type TimeOffEntry = {
  _id: string;
  date: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  user: Doc<"users"> | null;
};

interface CalendarViewProps {
  timeOffEntries: TimeOffEntry[];
  selectedTeamId?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ timeOffEntries, selectedTeamId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  // Group time off entries by date
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimeOffEntry[]>();

    let filtered = timeOffEntries;
    if (selectedTeamId) {
      filtered = timeOffEntries.filter(
        (entry) => entry.user?.teamId === selectedTeamId
      );
    }

    filtered.forEach((entry) => {
      const existing = map.get(entry.date) || [];
      existing.push(entry);
      map.set(entry.date, existing);
    });

    return map;
  }, [timeOffEntries, selectedTeamId]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date, entries: TimeOffEntry[]) => {
    if (entries.length > 0) {
      setSelectedDate(date);
    }
  };

  const selectedDateEntries = selectedDate
    ? entriesByDate.get(formatDate(selectedDate)) || []
    : [];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {getMonthName(month)} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
              aria-label="Previous month"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
              aria-label="Next month"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const dateStr = formatDate(date);
          const entries = entriesByDate.get(dateStr) || [];
          const isCurrentMonth = isSameMonth(date, currentDate);

          return (
            <DayCell
              key={index}
              date={date}
              entries={entries}
              isCurrentMonth={isCurrentMonth}
              onClick={() => handleDayClick(date, entries)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-6 py-3 border-t border-gray-200 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-100 border border-dashed border-amber-300 rounded"></div>
          <span className="text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-gray-600">Rejected</span>
        </div>
      </div>

      {/* Date Modal */}
      {selectedDate && (
        <DateModal
          date={selectedDate}
          entries={selectedDateEntries}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
