"use client";

import { useState, useMemo, useEffect } from "react";
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
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
  const updateUserName = useMutation(api.users.updateUserName);

  // Sync local state with currentUser data
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || "");
      setLastName(currentUser.lastName || "");
    }
  }, [currentUser]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  // Create a set of dates that have time off (already saved)
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

  const toggleDateSelection = async (date: Date) => {
    const dateStr = formatDate(date);

    // If already saved, check if it can be removed (not approved)
    if (timeOffDates.has(dateStr)) {
      const entry = myTimeOff?.find((e) => e.date === dateStr);
      if (entry?.status?.toLowerCase() === "approved") {
        // Can't remove approved time off
        return;
      }
      if (currentUser?._id) {
        try {
          await removeTimeOff({ userId: currentUser._id, date: dateStr });
        } catch {
          // Error is handled by the mutation
        }
      }
      return;
    }

    // Toggle pending selection
    setPendingDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!currentUser?._id || pendingDates.size === 0) return;

    setIsSubmitting(true);
    try {
      // Save all pending dates
      await Promise.all(
        Array.from(pendingDates).map((date) =>
          addTimeOff({ userId: currentUser._id, date })
        )
      );
      // Clear pending dates after successful submission
      setPendingDates(new Set());
    } finally {
      setIsSubmitting(false);
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

  const handleSaveProfile = async () => {
    if (!user?.id || !firstName.trim() || !lastName.trim()) return;

    setIsSavingProfile(true);
    try {
      await updateUserName({
        clerkId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(currentUser?.firstName || "");
    setLastName(currentUser?.lastName || "");
    setIsEditingProfile(false);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Time Off</h1>
          <p className="text-gray-600">
            Select dates and click submit to request time off
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={pendingDates.size === 0 || isSubmitting}
          className={`
            px-6 py-2.5 rounded-lg font-medium transition-colors
            ${pendingDates.size > 0 && !isSubmitting
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {isSubmitting ? "Submitting..." : `Submit${pendingDates.size > 0 ? ` (${pendingDates.size} day${pendingDates.size > 1 ? "s" : ""})` : ""}`}
        </button>
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
              const isSaved = timeOffDates.has(dateStr);
              const isPending = pendingDates.has(dateStr);
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={index}
                  onClick={() => toggleDateSelection(date)}
                  disabled={!isCurrentMonth}
                  className={`
                    min-h-[80px] p-2 border-b border-r border-gray-100 text-left
                    transition-colors
                    ${isCurrentMonth ? "hover:bg-gray-50" : ""}
                    ${!isCurrentMonth ? "bg-gray-50 cursor-default" : "cursor-pointer"}
                    ${isSaved && isCurrentMonth && myTimeOff?.find((e) => e.date === dateStr)?.status?.toLowerCase() === "approved" ? "bg-green-50 hover:bg-green-100" : ""}
                    ${isSaved && isCurrentMonth && myTimeOff?.find((e) => e.date === dateStr)?.status?.toLowerCase() === "pending" ? "bg-amber-50 hover:bg-amber-100" : ""}
                    ${isSaved && isCurrentMonth && myTimeOff?.find((e) => e.date === dateStr)?.status?.toLowerCase() === "rejected" ? "bg-red-50 hover:bg-red-100" : ""}
                    ${isPending && isCurrentMonth ? "bg-amber-50 hover:bg-amber-100" : ""}
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
                  {isSaved && isCurrentMonth && (() => {
                    const entry = myTimeOff?.find((e) => e.date === dateStr);
                    const normalizedStatus = entry?.status?.toLowerCase() || "pending";
                    const statusStyles: Record<string, string> = {
                      approved: "bg-green-100 text-green-800",
                      pending: "bg-amber-100 text-amber-800 border border-dashed border-amber-300",
                      rejected: "bg-red-100 text-red-800 line-through",
                    };
                    return (
                      <div className="mt-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded truncate block ${statusStyles[normalizedStatus] || statusStyles.pending}`}
                        >
                          {normalizedStatus === "approved"
                            ? "Approved"
                            : normalizedStatus === "pending"
                              ? "Pending"
                              : "Rejected"}
                        </span>
                      </div>
                    );
                  })()}
                  {isPending && isCurrentMonth && (
                    <div className="mt-1">
                      <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded truncate block border border-dashed border-amber-300">
                        Pending
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
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        entry.status?.toLowerCase() === "approved"
                          ? "bg-green-100 text-green-700"
                          : entry.status?.toLowerCase() === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {(entry.status || "pending").charAt(0).toUpperCase() +
                        (entry.status || "pending").slice(1).toLowerCase()}
                    </span>
                  </div>
                  {entry.status?.toLowerCase() !== "approved" && (
                    <button
                      onClick={() =>
                        removeTimeOff({
                          userId: currentUser._id,
                          date: entry.date,
                        })
                      }
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancel
                    </button>
                  )}
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

          {/* Profile Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Profile</h3>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter last name"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !firstName.trim() || !lastName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSavingProfile}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This name will appear on your PTO calendar entries
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
