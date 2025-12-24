<script lang="ts">
	import FeedMetadata from '$lib/components/feed-helpers/FeedMetadata.svelte';

	import * as Code from '$lib/components/ui/code';
	import FeedLikes from '$lib/components/feed-helpers/FeedLikes.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import CommentSection from '$lib/components/modules/comments/CommentSection.svelte';

	// Define Editor.js block type
	interface EditorJSBlock {
		type: string;
		data: any;
		id?: string;
	}

	// Define Editor.js content structure
	interface EditorJSContent {
		time?: number;
		blocks: EditorJSBlock[];
		version?: string;
	}

	// Props received from the server load function
	const props = $props();
	const feed = $derived(props.data.feed);

	// Type guard to check if content is Editor.js format
	function isEditorJSContent(content: any): content is EditorJSContent {
		return content && Array.isArray(content.blocks);
	}
</script>

<div class="container mx-auto max-w-4xl py-8">
	<div class="">
		<h1 class="mb-4 text-3xl font-bold md:text-4xl">{feed.title}</h1>
		<!-- Metadata Section -->
		<FeedMetadata {feed} viewMode="detail" />

		<div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
			<!-- <span
				class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
			>
				{feed.type}
			</span>
			{#if feed.public}
				<span
					class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
				>
					Public
				</span>
			{:else}
				<span
					class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"
				>
					Private
				</span>
			{/if} -->
			<FeedLikes
				feedId={feed._id}
				likeCount={feed.likeCount}
				isLiked={feed.isLiked}
				user={props.data.currentUser}
			/>
		</div>
	</div>
	<Separator class="my-4" />
	<!-- Display feed content -->
	<div class="prose max-w-none">
		{#if isEditorJSContent(feed.content) && feed.content.blocks && feed.content.blocks.length > 0}
			{#each feed.content.blocks as block, blockIdx (block.id || blockIdx)}
				{#if block.type === 'header'}
					{#if block.data.level === 1}
						<h1 class="mt-6 mb-4 text-2xl font-bold">{block.data.text}</h1>
					{:else if block.data.level === 2}
						<h2 class="mt-6 mb-4 text-xl font-bold">{block.data.text}</h2>
					{:else if block.data.level === 3}
						<h3 class="mt-6 mb-4 text-lg font-bold">{block.data.text}</h3>
					{:else if block.data.level === 4}
						<h4 class="mt-6 mb-4 text-base font-bold">{block.data.text}</h4>
					{:else if block.data.level === 5}
						<h5 class="mt-6 mb-4 text-sm font-bold">{block.data.text}</h5>
					{:else if block.data.level === 6}
						<h6 class="mt-6 mb-4 text-xs font-bold">{block.data.text}</h6>
					{:else}
						<h2 class="mt-6 mb-4 text-xl font-bold">{block.data.text}</h2>
					{/if}
				{:else if block.type === 'paragraph'}
					<p class="mb-4">
						{block.data.text}
					</p>
				{:else if block.type === 'list'}
					{#if block.data.style === 'ordered'}
						<ol class="mb-4 list-inside list-decimal">
							{#each block.data.items as item}
								<li class="mb-2 text-gray-700">{item}</li>
							{/each}
						</ol>
					{:else}
						<ul class="mb-4 list-inside list-disc">
							{#each block.data.items as item}
								<li class="mb-2 text-gray-700">{item}</li>
							{/each}
						</ul>
					{/if}
				{:else if block.type === 'image'}
					<div class="my-6">
						<img
							src={block.data.file?.url || block.data.url}
							alt={block.data.caption || 'Image'}
							class="h-auto max-w-full rounded-lg shadow-md"
						/>
						{#if block.data.caption}
							<p class="mt-2 text-center text-sm text-gray-500">{block.data.caption}</p>
						{/if}
					</div>
				{:else if block.type === 'code'}
					<div class="w-full p-6">
						<Code.Root lang={block.data.languageCode} code={block.data.code}>
							<Code.CopyButton />
						</Code.Root>
					</div>
				{:else if block.type === 'quote'}
					<blockquote class="my-6 border-l-4 border-blue-500 pl-4 text-gray-700 italic">
						{block.data.text}
						{#if block.data.caption}
							<footer class="mt-2 text-sm not-italic">— {block.data.caption}</footer>
						{/if}
					</blockquote>
				{:else if block.type === 'delimiter'}
					<div class="my-8 text-center">
						<div class="border-t border-gray-300"></div>
					</div>
				{:else if block.type === 'embed'}
					<div class="my-6">
						<div class="aspect-w-16 aspect-h-9">
							<iframe
								src={block.data.embed}
								class="h-96 w-full rounded-lg shadow-md"
								title="Embedded content"
								frameborder="0"
								allowfullscreen
							></iframe>
						</div>
					</div>
				{:else}
					<div class="my-4 border-l-4 border-yellow-400 bg-yellow-50 p-4">
						<p class="text-yellow-700">Unsupported block type: {block.type}</p>
					</div>
				{/if}
			{/each}
		{:else}
			<div class="py-12 text-center">
				<p class="text-gray-500">This feed has no content yet.</p>
			</div>
		{/if}
	</div>

	<!-- Comment Section -->
	<div class="mt-12 border-t pt-8">
		<h2 class="mb-6 text-2xl font-bold">Comments</h2>
		<CommentSection {feed} />
	</div>
</div>
