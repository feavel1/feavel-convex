import type { PageServerLoad } from './$types';
import { api } from '$convex/_generated/api.js';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

export const load: PageServerLoad = async ({ parent, locals }) => {
	// Load parent data (session, user info)
	const parentData = await parent();

	// Get current user
	const client = createConvexHttpClient({ token: locals.token });
	const currentUser = await client.query(api.auth.getCurrentUser, {});

	return {
		...parentData,
		currentUser
	};
};
