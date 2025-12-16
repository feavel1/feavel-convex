import { sequence } from "@sveltejs/kit/hooks";
import { paraglideMiddleware } from "$lib/paraglide/server";
import type { Handle } from "@sveltejs/kit";
import { createAuth } from "$convex/auth.js";
import { getToken } from "@mmailaender/convex-better-auth-svelte/sveltekit";

const originalHandle: Handle = async ({ event, resolve }) => {
  event.locals.token = await getToken(createAuth, event.cookies);

  return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) => paraglideMiddleware(event.request, ({ request, locale }) => {
  event.request = request;

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%paraglide.lang%", locale)
  });
});

export const handle = sequence(originalHandle, handleParaglide);
// import { auth } from "$convex/betterAuth/auth"; // path to your auth file
// import { svelteKitHandler } from "better-auth/svelte-kit";
// import { building } from "$app/environment";
// export async function handle({ event, resolve }) {
//   return svelteKitHandler({ event, resolve, auth, building });
// }
