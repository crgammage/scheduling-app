import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  departments: defineTable({
    name: v.string(),
  }),

  teams: defineTable({
    name: v.string(),
    departmentId: v.id("departments"),
  }).index("by_department", ["departmentId"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    title: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    departmentId: v.optional(v.id("departments")),
    imageUrl: v.optional(v.string()),
    isOnboarded: v.boolean(),
    role: v.optional(v.union(v.literal("manager"), v.literal("employee"))),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_department", ["departmentId"])
    .index("by_team", ["teamId"]),

  timeOffEntries: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO format YYYY-MM-DD
    createdAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_status", ["status"]),
});
