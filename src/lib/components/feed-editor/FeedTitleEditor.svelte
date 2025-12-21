<script lang="ts">
	import { slugify } from 'transliteration';

	let { feed, debouncedSave } = $props();

	// Function to generate slug from title
	const generateSlug = (title: string) => {
		return slugify(title, {
			lowercase: true,
			separator: '-',
			trim: true
		});
	};
</script>

<div class="mb-6">
	<input
		type="text"
		value={feed?.title ?? ''}
		oninput={(e) => {
			const newTitle = (e.target as HTMLInputElement).value;
			if (feed) {
				feed.title = newTitle;
				// Generate slug from the new title
				feed.slug = generateSlug(newTitle);
				debouncedSave();
			}
		}}
		class="w-full border-b border-gray-300 p-2 text-2xl font-bold focus:border-blue-500 focus:outline-none"
		placeholder="Feed title"
	/>
</div>
