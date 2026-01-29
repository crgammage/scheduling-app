import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addTimeOff = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if entry already exists
    const existing = await ctx.db
      .query("timeOffEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const entryId = await ctx.db.insert("timeOffEntries", {
      userId: args.userId,
      date: args.date,
      createdAt: Date.now(),
      status: "pending",
    });

    return entryId;
  },
});

export const removeTimeOff = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("timeOffEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (entry) {
      if (entry.status?.toLowerCase() === "approved") {
        throw new Error("Cannot remove approved time off. Contact your manager.");
      }
      await ctx.db.delete(entry._id);
    }
  },
});

export const getMyTimeOff = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timeOffEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return entries;
  },
});

export const getTimeOffByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    // Get all time off entries in date range
    const allEntries = await ctx.db
      .query("timeOffEntries")
      .withIndex("by_date")
      .collect();

    // Filter by date range
    const entriesInRange = allEntries.filter(
      (entry) => entry.date >= args.startDate && entry.date <= args.endDate
    );

    // Get user details for each entry
    const entriesWithUsers = await Promise.all(
      entriesInRange.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          ...entry,
          user,
        };
      })
    );

    // Filter by department or team if specified
    let filteredEntries = entriesWithUsers.filter((entry) => entry.user !== null);

    if (args.departmentId) {
      filteredEntries = filteredEntries.filter(
        (entry) => entry.user?.departmentId === args.departmentId
      );
    }

    if (args.teamId) {
      filteredEntries = filteredEntries.filter(
        (entry) => entry.user?.teamId === args.teamId
      );
    }

    return filteredEntries;
  },
});

export const getTimeOffByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    // Get all users in department
    const users = await ctx.db
      .query("users")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    // Get time off for each user
    const allTimeOff = await Promise.all(
      users.map(async (user) => {
        const entries = await ctx.db
          .query("timeOffEntries")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        return entries.map((entry) => ({ ...entry, user }));
      })
    );

    return allTimeOff.flat();
  },
});

export const getTimeOffByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // Get all users in team
    const users = await ctx.db
      .query("users")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get time off for each user
    const allTimeOff = await Promise.all(
      users.map(async (user) => {
        const entries = await ctx.db
          .query("timeOffEntries")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        return entries.map((entry) => ({ ...entry, user }));
      })
    );

    return allTimeOff.flat();
  },
});

export const reviewTimeOff = mutation({
  args: {
    entryId: v.id("timeOffEntries"),
    reviewerId: v.id("users"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Time off entry not found");
    }

    // Get the requesting user to find their team
    const requestingUser = await ctx.db.get(entry.userId);
    if (!requestingUser) {
      throw new Error("User not found");
    }

    // Get the reviewer and verify they're the team's manager
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer) {
      throw new Error("Reviewer not found");
    }

    if (reviewer.role?.toLowerCase() !== "manager") {
      throw new Error("Only managers can approve or reject time off requests");
    }

    if (reviewer.teamId !== requestingUser.teamId) {
      throw new Error("You can only review requests from your own team");
    }

    await ctx.db.patch(args.entryId, {
      status: args.decision,
      reviewedBy: args.reviewerId,
      reviewedAt: Date.now(),
      rejectionReason:
        args.decision === "rejected" ? args.rejectionReason : undefined,
    });

    return args.entryId;
  },
});

export const getPendingRequestsForTeam = query({
  args: { managerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the manager to find their team
    const manager = await ctx.db.get(args.managerId);
    if (!manager || manager.role?.toLowerCase() !== "manager" || !manager.teamId) {
      return [];
    }

    // Get all users on this team (excluding the manager)
    const teamUsers = await ctx.db
      .query("users")
      .withIndex("by_team", (q) => q.eq("teamId", manager.teamId))
      .collect();

    const otherTeamUsers = teamUsers.filter((u) => u._id !== args.managerId);

    // Get pending requests for all team members
    const pendingRequests = await Promise.all(
      otherTeamUsers.map(async (user) => {
        const entries = await ctx.db
          .query("timeOffEntries")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        const pending = entries.filter((e) => e.status?.toLowerCase() === "pending");
        return pending.map((entry) => ({ ...entry, user }));
      })
    );

    return pendingRequests.flat().sort((a, b) => a.date.localeCompare(b.date));
  },
});
