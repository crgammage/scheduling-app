import { mutation } from "./_generated/server";

export const migrateTimeOffStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("timeOffEntries").collect();
    let migrated = 0;

    for (const entry of entries) {
      if (!entry.status) {
        await ctx.db.patch(entry._id, {
          status: "approved", // Existing entries are considered approved
        });
        migrated++;
      }
    }

    return { total: entries.length, migrated };
  },
});

export const migrateUserRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let migrated = 0;

    for (const user of users) {
      if (!user.role) {
        await ctx.db.patch(user._id, {
          role: "employee", // Default existing users to employee
        });
        migrated++;
      }
    }

    return { total: users.length, migrated };
  },
});
