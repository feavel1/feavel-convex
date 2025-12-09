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
    // Use Convex's server-side query to fetch the feed by slug
    const feed = await client.query(api.feeds.feeds.getFeedBySlug, {
      slug,
    });

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
