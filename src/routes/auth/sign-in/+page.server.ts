import type { PageServerLoad } from './$types.js';
import { api } from '$convex/_generated/api.js';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

export const load: PageServerLoad = async ({ locals }) => {
	const client = createConvexHttpClient({ token: locals.token });

	try {
		const currentUser = await client.query(api.auth.getCurrentUser, {});
		return { currentUser };
	} catch {
		return { currentUser: null };
	}
};
