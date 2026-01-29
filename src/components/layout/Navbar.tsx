"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Navbar() {
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              TimeOff
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Calendar
              </Link>
              <Link
                href="/dashboard/my-time-off"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                My Time Off
              </Link>
              {currentUser?.role?.toLowerCase() === "manager" && (
                <Link
                  href="/dashboard/approvals"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Approvals
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="hidden md:block text-sm text-gray-600">
                {currentUser.firstName} {currentUser.lastName}
                {currentUser.title && (
                  <span className="text-gray-400"> - {currentUser.title}</span>
                )}
              </div>
            )}
            <UserButton afterSwitchSessionUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
