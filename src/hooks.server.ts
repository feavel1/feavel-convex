import type { Handle } from "@sveltejs/kit";
import { createAuth } from "$convex/auth.js";
import { getToken } from "@mmailaender/convex-better-auth-svelte/sveltekit";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.token = await getToken(createAuth, event.cookies);
  return resolve(event);
};

// import { auth } from "$convex/betterAuth/auth"; // path to your auth file
// import { svelteKitHandler } from "better-auth/svelte-kit";
// import { building } from "$app/environment";
// export async function handle({ event, resolve }) {
//   return svelteKitHandler({ event, resolve, auth, building });
// }
