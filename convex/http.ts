import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Webhook endpoint for Clerk user events
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const eventType = payload.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const userData = payload.data;

      await ctx.runMutation(api.users.createUser, {
        clerkId: userData.id,
        email: userData.email_addresses?.[0]?.email_address || "",
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        imageUrl: userData.image_url,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
