import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { api } from "$convex/_generated/api.js";
import { createConvexHttpClient } from "@mmailaender/convex-better-auth-svelte/sveltekit";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { slug } = params;

  // Validate slug parameter
  if (!slug || typeof slug !== "string" || slug.length === 0) {
    throw error(400, "Invalid feed slug");
  }

  const client = createConvexHttpClient({ token: locals.token });

  try {
    // Use Convex's server-side query to fetch the feed by slug using unified function
    const result = await client.query(api.feeds.feeds.unifiedFeedQuery, {
      slug,
    });

    // The unified function returns { feeds: [feed], nextCursor: undefined } for slug queries
    const feed = result.feeds?.[0];

    // If feed is not found, return a 404 error
    if (!feed) {
      throw error(404, "Feed not found");
    }

    // Return the feed data to the client component
    return {
      feed,
    };
  } catch (err) {
    // Handle permission errors specifically
    if (err instanceof Error && err.message.includes("permission")) {
      throw error(403, "You do not have permission to view this feed");
    }
    throw error(500, "Error fetching feed");
  }
};
