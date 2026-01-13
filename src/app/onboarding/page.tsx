"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = useQuery(api.org.getDepartments);
  const teams = useQuery(
    api.org.getTeams,
    selectedDepartmentId
      ? { departmentId: selectedDepartmentId as Id<"departments"> }
      : {}
  );
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const createUser = useMutation(api.users.createUser);
  const updateProfile = useMutation(api.users.updateUserProfile);

  // Create user in Convex if they don't exist (fallback if webhook not configured)
  useEffect(() => {
    async function ensureUserExists() {
      if (user && currentUser === null) {
        await createUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          imageUrl: user.imageUrl,
        });
      }
    }
    ensureUserExists();
  }, [user, currentUser, createUser]);

  // Redirect if user is already onboarded
  useEffect(() => {
    if (currentUser?.isOnboarded) {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  // Reset team selection when department changes
  useEffect(() => {
    setSelectedTeamId("");
  }, [selectedDepartmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !selectedDepartmentId || !selectedTeamId || !title) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile({
        clerkId: user.id,
        title,
        teamId: selectedTeamId as Id<"teams">,
        departmentId: selectedDepartmentId as Id<"departments">,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Welcome to TimeOff!
        </h2>
        <p className="mt-2 text-center text-gray-600">
          Let&apos;s set up your profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Job Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-gray-700"
              >
                Department
              </label>
              <select
                id="department"
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a department</option>
                {departments?.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team */}
            <div>
              <label
                htmlFor="team"
                className="block text-sm font-medium text-gray-700"
              >
                Team
              </label>
              <select
                id="team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                required
                disabled={!selectedDepartmentId}
              >
                <option value="">
                  {selectedDepartmentId
                    ? "Select a team"
                    : "Select a department first"}
                </option>
                {teams?.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !title ||
                !selectedDepartmentId ||
                !selectedTeamId
              }
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Continue to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
