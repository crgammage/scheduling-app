"use client";

import { isSameDay } from "@/lib/utils";
import { Doc } from "../../../convex/_generated/dataModel";

type TimeOffEntry = {
  _id: string;
  date: string;
  userId: string;
  user: Doc<"users"> | null;
};

interface DayCellProps {
  date: Date;
  entries: TimeOffEntry[];
  isCurrentMonth: boolean;
  onClick: () => void;
}

const MAX_VISIBLE_USERS = 3;

export function DayCell({ date, entries, isCurrentMonth, onClick }: DayCellProps) {
  const isToday = isSameDay(date, new Date());
  const hasEntries = entries.length > 0;
  const visibleEntries = entries.slice(0, MAX_VISIBLE_USERS);
  const remainingCount = entries.length - MAX_VISIBLE_USERS;

  return (
    <div
      className={`
        min-h-[100px] p-2 border-b border-r border-gray-100
        ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
        ${hasEntries ? "cursor-pointer hover:bg-blue-50" : ""}
      `}
      onClick={hasEntries ? onClick : undefined}
    >
      {/* Date Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            inline-flex items-center justify-center w-7 h-7 text-sm
            ${isToday ? "bg-blue-600 text-white rounded-full font-semibold" : ""}
            ${!isCurrentMonth && !isToday ? "text-gray-400" : ""}
            ${isCurrentMonth && !isToday ? "text-gray-900" : ""}
          `}
        >
          {date.getDate()}
        </span>
        {hasEntries && (
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {entries.length}
          </span>
        )}
      </div>

      {/* User Entries */}
      <div className="space-y-1">
        {visibleEntries.map((entry) => (
          <div
            key={entry._id}
            className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded truncate"
            title={`${entry.user?.firstName} ${entry.user?.lastName}`}
          >
            {entry.user?.firstName} {entry.user?.lastName?.[0]}.
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-gray-500 px-1.5">
            +{remainingCount} more
          </div>
        )}
      </div>
    </div>
  );
}
