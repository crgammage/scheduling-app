import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      isOnboarded: false,
    });

    return userId;
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

export const updateUserProfile = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    teamId: v.id("teams"),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      title: args.title,
      teamId: args.teamId,
      departmentId: args.departmentId,
      isOnboarded: true,
    });

    return user._id;
  },
});

export const getUsersByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    return users;
  },
});

export const getUsersByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    return users;
  },
});
