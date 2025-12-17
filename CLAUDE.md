# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern SvelteKit application with Convex for backend services and Better Auth for authentication. The project uses Svelte 5, Tailwind CSS, and shadcn-svelte components.

## Development Commands

### Common Commands

- `bun run check` - Run type checking ALWAYS PERFORM TYPE CHECK AFTER TASK COMPLETE

### Convex Commands

- `bun x convex dev` - Run Convex in development mode
- `bun x convex deploy` - Deploy Convex functions
- `bun x convex env set KEY_NAME value` - Set environment variables for Convex
- `bun x convex schema push` - Push schema changes to Convex

### Authentication Setup

For Google OAuth, set these environment variables:

```sh
bun x convex env set GOOGLE_CLIENT_ID your_google_client_id_here
bun x convex env set GOOGLE_CLIENT_SECRET your_google_client_secret_here
```

## Architecture

### Frontend Structure

- **SvelteKit**: Main framework for routing and SSR
- **Tailwind CSS**: Styling with v4 configuration
- **shadcn-svelte**: Pre-built UI components
- **convex-svelte**: Real-time data binding for Svelte 5
- **File-based routing** in `src/routes/`
- **Components** in `src/lib/components/`
- **Utilities** in `src/lib/`

### Backend Structure (Convex)

- **Location**: `src/convex/` (configured in convex.json)
- **New function syntax**: Always use the new function syntax with args, returns, and handler
- **Function types**:
  - Public: `query`, `mutation`, `action`
  - Internal: `internalQuery`, `internalMutation`, `internalAction`
- **Schema**: Defined in `src/convex/schema.ts`
- **HTTP endpoints**: Defined in `src/convex/http.ts`

### Authentication

- **Better Auth**: Hybrid authentication system with email/password and social providers
- **Server-side handling**: In `src/hooks.server.ts`
- **Client-side setup**: In `src/lib/auth-client.ts`
- **UI components**: Login forms with Google OAuth support

## Key Development Guidelines

### Convex Development

- Always include argument and return validators for all Convex functions
- Use `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction` for function calls within functions
- Use indexes instead of filters in queries for performance
- For real-time queries in Svelte 5: use `useQuery()` with closure syntax for arguments
- Use `useConvexClient()` then `client.mutation()` and `client.action()` for writes

### Svelte 5 Integration

- Reactive queries automatically update when Convex data changes
- Use `$derived` for conditional reactive queries
- Access `query.isLoading` and `query.error` for loading and error states

### TypeScript Guidelines

- Use `Id<'tableName'>` type from `./_generated/dataModel` for document IDs
- Be strict with types, particularly for document IDs
- Always add `@types/node` when using Node.js built-ins

### Schema Guidelines

- Always define schema in `src/convex/schema.ts`
- Include all index fields in the index name
- Index fields must be queried in the same order they're defined
- System fields `_id` and `_creationTime` are automatically added to all documents

### File Structure

- `src/convex/` - Convex functions and schema (backend)
- `src/routes/` - SvelteKit routing and pages
- `src/lib/` - Shared components, utilities, and hooks
- `src/lib/components/` - UI components and forms
- `src/lib/components/ui/` - shadcn-svelte components
- `docs/` - Additional documentation files

## Form Handling with Superforms

The project uses sveltekit-superforms with Zod for form validation. Follow this pattern:

### Schema Definition (in +page.svelte module script)

```ts
import { z } from 'zod/v4';

export const settingsSchema = z.object({
	full_name: z.string().max(100).nullable(),
	description: z.string().max(500).nullable(),
	birthday: z.string().or(z.literal('')).nullable()
});

export type SettingsSchema = typeof settingsSchema;
```

### Server-side Loading (+page.server.ts)

```ts
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { settingsSchema } from './+page.svelte';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { session, userProfile } = await parent();

	const formData = {
		full_name: userProfile?.full_name ?? null,
		description: userProfile?.description ?? null,
		birthday: userProfile?.birthday ?? null
	};

	return {
		userProfile,
		session,
		form: await superValidate(formData, zod4(settingsSchema))
	};
};
```

### Client-side Implementation (+page.svelte)

```svelte
<script>
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { settingsSchema } from './+page.svelte';

	const { data } = $props();
	const { form: formData } = data;

	const form = superForm(formData, {
		validators: zod4Client(settingsSchema),
		resetForm: false,
		onResult: () => {
			// Focus on first error
			if (form.errors && Object.keys(form.errors).length) {
				requestAnimationFrame(() => {
					document.querySelector < HTMLElement > '[aria-invalid="true"]'?.focus();
				});
			}
		},
		onUpdated({ form }) {
			if (form.message) {
				toast.success(form.message.text);
			}
		}
	});

	const { form: formValues, enhance, submitting, message } = form;
</script>

<form method="POST" use:enhance>
	<input bind:value={$formValues.full_name} />
	<!-- Form fields -->
	<button disabled={$submitting}
		>{#if $submitting}
			Saving...
		{:else}
			Save Changes
		{/if}</button
	>
</form>
```
