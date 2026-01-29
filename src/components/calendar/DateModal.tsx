"use client";

import { Doc } from "../../../convex/_generated/dataModel";

type TimeOffEntry = {
  _id: string;
  date: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  user: Doc<"users"> | null;
};

interface DateModalProps {
  date: Date;
  entries: TimeOffEntry[];
  onClose: () => void;
}

export function DateModal({ date, entries, onClose }: DateModalProps) {
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {formattedDate}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {entries.length} {entries.length === 1 ? "person" : "people"} taking time off
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {entry.user?.imageUrl ? (
                      <img
                        src={entry.user.imageUrl}
                        alt={`${entry.user.firstName} ${entry.user.lastName}`}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {entry.user?.firstName?.[0]}
                          {entry.user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.user?.firstName} {entry.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {entry.user?.title || "No title"}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                        entry.status?.toLowerCase() === "approved"
                          ? "bg-green-100 text-green-800"
                          : entry.status?.toLowerCase() === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {entry.status?.toLowerCase() === "approved"
                        ? "Approved"
                        : entry.status?.toLowerCase() === "pending"
                          ? "Pending"
                          : "Rejected"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
