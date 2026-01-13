import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    const departments = await ctx.db.query("departments").collect();
    return departments;
  },
});

export const getTeams = query({
  args: { departmentId: v.optional(v.id("departments")) },
  handler: async (ctx, args) => {
    if (args.departmentId) {
      const departmentId = args.departmentId;
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_department", (q) => q.eq("departmentId", departmentId))
        .collect();
      return teams;
    }

    const teams = await ctx.db.query("teams").collect();
    return teams;
  },
});

export const getTeamWithDepartment = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const department = await ctx.db.get(team.departmentId);
    return { team, department };
  },
});

// Seed functions for initial data
export const seedDepartments = mutation({
  args: {},
  handler: async (ctx) => {
    const existingDepts = await ctx.db.query("departments").collect();
    if (existingDepts.length > 0) {
      return { message: "Departments already seeded" };
    }

    const departments = [
      { name: "Engineering" },
      { name: "Marketing" },
      { name: "Sales" },
      { name: "Human Resources" },
      { name: "Finance" },
      { name: "Operations" },
      { name: "Enterprise Digital" },
    ];

    const deptIds: Record<string, string> = {};
    for (const dept of departments) {
      const id = await ctx.db.insert("departments", dept);
      deptIds[dept.name] = id;
    }

    // Seed teams for each department
    const teams = [
      // Engineering
      { name: "Frontend", departmentId: deptIds["Engineering"] },
      { name: "Backend", departmentId: deptIds["Engineering"] },
      { name: "DevOps", departmentId: deptIds["Engineering"] },
      { name: "QA", departmentId: deptIds["Engineering"] },
      // Marketing
      { name: "Content", departmentId: deptIds["Marketing"] },
      { name: "Digital", departmentId: deptIds["Marketing"] },
      { name: "Brand", departmentId: deptIds["Marketing"] },
      // Sales
      { name: "Enterprise", departmentId: deptIds["Sales"] },
      { name: "SMB", departmentId: deptIds["Sales"] },
      { name: "Partnerships", departmentId: deptIds["Sales"] },
      // HR
      { name: "Recruiting", departmentId: deptIds["Human Resources"] },
      { name: "People Ops", departmentId: deptIds["Human Resources"] },
      // Finance
      { name: "Accounting", departmentId: deptIds["Finance"] },
      { name: "FP&A", departmentId: deptIds["Finance"] },
      // Operations
      { name: "IT", departmentId: deptIds["Operations"] },
      { name: "Facilities", departmentId: deptIds["Operations"] },
      // Enterprise Digital
      { name: "Digital Strategy", departmentId: deptIds["Enterprise Digital"] },
      { name: "Digital Products", departmentId: deptIds["Enterprise Digital"] },
      { name: "Digital Transformation", departmentId: deptIds["Enterprise Digital"] },
    ];

    for (const team of teams) {
      await ctx.db.insert("teams", {
        name: team.name,
        departmentId: team.departmentId as Id<"departments">,
      });
    }

    return { message: "Departments and teams seeded successfully" };
  },
});
