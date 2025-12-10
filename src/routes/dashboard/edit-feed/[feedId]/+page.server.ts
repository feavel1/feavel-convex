// import type { PageServerLoad } from "./$types";
// import { api } from "$convex/_generated/api.js";
// import { createConvexHttpClient } from "@mmailaender/convex-better-auth-svelte/sveltekit";
// import { redirect } from "@sveltejs/kit";

// export const load: PageServerLoad = async ({ params, locals }) => {
//   // Create authenticated Convex client using the token from locals
//   const client = createConvexHttpClient({ token: locals.token });

//   // Check if user is authenticated by attempting to get current user
//   try {
//     const currentUser = await client.query(api.auth.getCurrentUser, {});
//     if (!currentUser) {
//       // Redirect to login if not authenticated
//       throw redirect(303, "/login");
//     }
//   } catch (error) {
//     // If authentication fails, redirect to login
//     throw redirect(303, "/login");
//   }

//   try {
//     // Fetch the feed data server-side with proper authentication
//     const feed = await client.query(api.feeds.feeds.getFeedById, {
//       feedId: params.feedId as any,
//     });

//     return {
//       feed,
//       error: null,
//     };
//   } catch (error) {
//     console.error("Error fetching feed:", error);
//     return {
//       feed: null,
//       error: error instanceof Error ? error.message : "Failed to load feed",
//     };
//   }
// };
