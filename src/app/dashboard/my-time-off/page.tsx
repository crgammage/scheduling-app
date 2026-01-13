"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  getMonthDays,
  getMonthName,
  isSameMonth,
  isSameDay,
  formatDate,
} from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MyTimeOffPage() {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const myTimeOff = useQuery(
    api.timeOff.getMyTimeOff,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const addTimeOff = useMutation(api.timeOff.addTimeOff);
  const removeTimeOff = useMutation(api.timeOff.removeTimeOff);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  // Create a set of dates that have time off
  const timeOffDates = useMemo(() => {
    return new Set(myTimeOff?.map((entry) => entry.date) || []);
  }, [myTimeOff]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleTimeOff = async (date: Date) => {
    if (!currentUser?._id) return;

    const dateStr = formatDate(date);

    if (timeOffDates.has(dateStr)) {
      await removeTimeOff({ userId: currentUser._id, date: dateStr });
    } else {
      await addTimeOff({ userId: currentUser._id, date: dateStr });
    }
  };

  // Get upcoming time off (sorted by date)
  const upcomingTimeOff = useMemo(() => {
    if (!myTimeOff) return [];
    const today = formatDate(new Date());
    return myTimeOff
      .filter((entry) => entry.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [myTimeOff]);

  if (!currentUser || myTimeOff === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Time Off</h1>
        <p className="text-gray-600">
          Click on dates to add or remove your time off
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
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
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isToday = isSameDay(date, new Date());
              const hasTimeOff = timeOffDates.has(dateStr);
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={index}
                  onClick={() => toggleTimeOff(date)}
                  disabled={!isCurrentMonth}
                  className={`
                    min-h-[80px] p-2 border-b border-r border-gray-100 text-left
                    transition-colors
                    ${isCurrentMonth ? "hover:bg-gray-50" : ""}
                    ${!isCurrentMonth ? "bg-gray-50 cursor-default" : "cursor-pointer"}
                    ${hasTimeOff && isCurrentMonth ? "bg-blue-50 hover:bg-blue-100" : ""}
                  `}
                >
                  <span
                    className={`
                      inline-flex items-center justify-center w-7 h-7 text-sm
                      ${isToday ? "bg-blue-600 text-white rounded-full font-semibold" : ""}
                      ${!isCurrentMonth && !isToday ? "text-gray-400" : ""}
                      ${isCurrentMonth && !isToday ? "text-gray-900" : ""}
                      ${isPast && isCurrentMonth && !isToday ? "text-gray-400" : ""}
                    `}
                  >
                    {date.getDate()}
                  </span>
                  {hasTimeOff && isCurrentMonth && (
                    <div className="mt-1">
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                        PTO
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Time Off Sidebar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Time Off
          </h2>

          {upcomingTimeOff.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No upcoming time off scheduled
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingTimeOff.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(entry.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      removeTimeOff({
                        userId: currentUser._id,
                        date: entry.date,
                      })
                    }
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Days Scheduled</span>
              <span className="text-lg font-semibold text-gray-900">
                {myTimeOff?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
