// Read docs/R2.md to understand how it works.

import { R2 } from '@convex-dev/r2';
import { components } from './_generated/api';
import { mutation } from './_generated/server';
import { authComponent } from './auth';

export const r2 = new R2(components.r2);

export const getDecoratedThumbnailUrl = (fileKey: string) =>
	`https://storage.feavel.com/${fileKey}`;

// A custom mutation that creates a key from the user id and a uuid. If the key
// already exists, the mutation will fail.
export const genAvatarUploadURL = mutation({
	args: {},
	handler: async (ctx) => {
		// Replace this with whatever function you use to get the current user
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('User not authenticated');
		}
		const key = `avatars/${crypto.randomUUID()}`;
		return r2.generateUploadUrl(key);
	}
});
