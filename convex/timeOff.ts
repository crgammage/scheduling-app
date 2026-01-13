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
