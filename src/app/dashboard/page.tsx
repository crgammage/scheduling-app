"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CalendarView } from "@/components/calendar/CalendarView";
import { TeamFilter } from "@/components/calendar/TeamFilter";
import { getMonthRange } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardPage() {
  const { user } = useUser();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [currentDate] = useState(new Date());

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get teams for the user's department
  const teams = useQuery(
    api.org.getTeams,
    currentUser?.departmentId
      ? { departmentId: currentUser.departmentId as Id<"departments"> }
      : "skip"
  );

  // Get 3 months of data (previous, current, next)
  const dateRanges = useMemo(() => {
    const ranges: { start: string; end: string }[] = [];
    for (let i = -1; i <= 1; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      ranges.push(getMonthRange(date.getFullYear(), date.getMonth()));
    }
    return ranges;
  }, [currentDate]);

  const timeOffData = useQuery(
    api.timeOff.getTimeOffByDateRange,
    currentUser?.departmentId
      ? {
          startDate: dateRanges[0]?.start || "",
          endDate: dateRanges[2]?.end || "",
          departmentId: currentUser.departmentId as Id<"departments">,
        }
      : "skip"
  );

  if (!currentUser || !teams || timeOffData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Calendar</h1>
          <p className="text-gray-600">
            View time off for your department
          </p>
        </div>
        <TeamFilter
          teams={teams}
          selectedTeamId={selectedTeamId}
          onTeamChange={setSelectedTeamId}
        />
      </div>

      {/* Calendar */}
      <CalendarView
        timeOffEntries={timeOffData || []}
        selectedTeamId={selectedTeamId}
      />

      {/* Monthly Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Time Off This Month
        </h2>
        <MonthlyList entries={timeOffData || []} selectedTeamId={selectedTeamId} />
      </div>
    </div>
  );
}

// Monthly list component showing time off organized by date
function MonthlyList({
  entries,
  selectedTeamId,
}: {
  entries: Array<{
    _id: string;
    date: string;
    userId: string;
    user: { firstName: string; lastName: string; title?: string; teamId?: string; imageUrl?: string } | null;
  }>;
  selectedTeamId: string;
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter and organize entries
  const organizedEntries = useMemo(() => {
    let filtered = entries;

    // Filter by team if selected
    if (selectedTeamId) {
      filtered = entries.filter((e) => e.user?.teamId === selectedTeamId);
    }

    // Filter to current month only
    filtered = filtered.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      );
    });

    // Sort by date
    filtered.sort((a, b) => a.date.localeCompare(b.date));

    // Group by date
    const grouped = new Map<string, typeof filtered>();
    filtered.forEach((entry) => {
      const existing = grouped.get(entry.date) || [];
      existing.push(entry);
      grouped.set(entry.date, existing);
    });

    return grouped;
  }, [entries, selectedTeamId, currentMonth, currentYear]);

  if (organizedEntries.size === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No time off scheduled for this month
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(organizedEntries.entries()).map(([date, dateEntries]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <div className="space-y-2">
            {dateEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {entry.user?.imageUrl ? (
                  <img
                    src={entry.user.imageUrl}
                    alt={`${entry.user.firstName} ${entry.user.lastName}`}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {entry.user?.firstName?.[0]}
                      {entry.user?.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.user?.firstName} {entry.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{entry.user?.title}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  PTO
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
