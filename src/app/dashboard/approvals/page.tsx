"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ApprovalsPage() {
  const { user } = useUser();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const pendingRequests = useQuery(
    api.timeOff.getPendingRequestsForTeam,
    currentUser?._id ? { managerId: currentUser._id } : "skip"
  );

  const reviewTimeOff = useMutation(api.timeOff.reviewTimeOff);

  // Loading state
  if (!currentUser || pendingRequests === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect non-managers
  if (currentUser.role?.toLowerCase() !== "manager") {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            Only managers can access this page. If you believe this is an error,
            please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const handleApprove = async (entryId: string) => {
    if (!currentUser?._id) return;
    setProcessingId(entryId);
    try {
      await reviewTimeOff({
        entryId: entryId as Id<"timeOffEntries">,
        reviewerId: currentUser._id,
        decision: "approved",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (entryId: string) => {
    if (!currentUser?._id) return;
    setProcessingId(entryId);
    try {
      await reviewTimeOff({
        entryId: entryId as Id<"timeOffEntries">,
        reviewerId: currentUser._id,
        decision: "rejected",
        rejectionReason: rejectionReason || undefined,
      });
      setShowRejectModal(null);
      setRejectionReason("");
    } finally {
      setProcessingId(null);
    }
  };

  // Group requests by user
  const requestsByUser = pendingRequests.reduce(
    (acc, request) => {
      const oderId = request.userId.toString();
      if (!acc[oderId]) {
        acc[oderId] = { user: request.user, requests: [] };
      }
      acc[oderId].requests.push(request);
      return acc;
    },
    {} as Record<
      string,
      {
        user: (typeof pendingRequests)[0]["user"];
        requests: typeof pendingRequests;
      }
    >
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Off Approvals</h1>
        <p className="text-gray-600">
          Review and approve time off requests from your team
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No pending requests</p>
          <p className="text-gray-400 text-sm mt-1">
            All caught up! Check back later for new requests.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(requestsByUser).map(
            ([oderId, { user: requestUser, requests }]) => (
              <div key={oderId} className="bg-white rounded-lg shadow">
                {/* User header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                  {requestUser?.imageUrl ? (
                    <img
                      src={requestUser.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {requestUser?.firstName?.[0]}
                        {requestUser?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {requestUser?.firstName} {requestUser?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{requestUser?.title}</p>
                  </div>
                  <span className="ml-auto bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-medium">
                    {requests.length} pending
                  </span>
                </div>

                {/* Requests */}
                <div className="divide-y divide-gray-100">
                  {requests.map((request) => (
                    <div
                      key={request._id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(
                            request.date + "T00:00:00"
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          Requested{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request._id)}
                          disabled={processingId === request._id}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setShowRejectModal(request._id)}
                          disabled={processingId === request._id}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => {
              setShowRejectModal(null);
              setRejectionReason("");
            }}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Request</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={processingId === showRejectModal}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
