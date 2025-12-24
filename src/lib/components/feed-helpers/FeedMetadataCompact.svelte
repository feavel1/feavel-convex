<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { Id } from '$convex/_generated/dataModel';

	type Feed = {
		_id: Id<'feed'>;
		_creationTime: number;
		title?: string;
		content?: any;
		type?: string;
		public?: boolean;
		meta?: any;
		coverFileId?: string;
		language?: string;
		createdAt: number;
		updatedAt?: number;
		createdBy: string;
		slug?: string;
		likeCount?: number;
		isLiked?: boolean;
	};

	const { feed } = $props<{ feed: Feed | any }>();

	// Helper function to format price
	function formatPrice(price: number | string | undefined): string {
		if (typeof price === 'number') {
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD'
			}).format(price);
		}
		if (typeof price === 'string') {
			return price;
		}
		return '';
	}

	// Check if metadata exists to determine if we should show the section
	const hasMetadata = $derived(
		!!(
			feed?.meta &&
			// Check for article metadata
			((feed.type === 'article' && (feed.meta.keywords?.length || feed.meta.author)) ||
				// Check for product metadata
				((feed.type === 'product' || feed.type === 'custom') &&
					(feed.meta.product?.price !== undefined || feed.meta.price !== undefined)) ||
				// Check for service metadata
				(feed.type === 'service' &&
					(feed.meta.service?.priceRange ||
						feed.meta.service?.estimateTime ||
						feed.meta.priceRange ||
						feed.meta.estimateTime)) ||
				// For other types, check if there's any meta data
				(feed.meta && Object.keys(feed.meta).length > 0))
		)
	);
</script>

{#if hasMetadata}
	<div class="flex items-center gap-2 text-xs">
		{#if feed.type}
			<Badge variant="secondary" class="h-6 px-2 py-0.5 text-xs">
				{feed.type}
			</Badge>
		{/if}

		{#if feed.type === 'article'}
			<!-- Article-specific metadata -->
			{#if feed.meta?.keywords?.length}
				<div class="flex gap-1">
					{#each feed.meta.keywords.slice(0, 2) as keyword, i}
						{#if keyword && keyword.trim()}
							<Badge variant="outline" class="h-6 px-2 py-0.5 text-xs">
								{keyword}
							</Badge>
						{/if}
					{/each}
				</div>
			{/if}
			{#if feed.meta?.author}
				<span class="text-muted-foreground">{feed.meta.author}</span>
			{/if}
		{:else if feed.type === 'product' || feed.type === 'custom'}
			<!-- Product-specific metadata -->
			{#if feed.meta?.product?.price !== undefined}
				<span class="font-medium">{formatPrice(feed.meta.product.price)}</span>
			{:else if feed.meta?.price !== undefined}
				<span class="font-medium">{formatPrice(feed.meta.price)}</span>
			{/if}
		{:else if feed.type === 'service'}
			<!-- Service-specific metadata -->
			{#if feed.meta?.service?.priceRange}
				<span class="font-medium">{feed.meta.service.priceRange}</span>
			{/if}
			{#if feed.meta?.service?.estimateTime}
				<span class="text-muted-foreground">{feed.meta.service.estimateTime}</span>
			{/if}
			{#if !feed.meta?.service?.priceRange && !feed.meta?.service?.estimateTime}
				{#if feed.meta?.priceRange}
					<span class="font-medium">{feed.meta.priceRange}</span>
				{/if}
				{#if feed.meta?.estimateTime}
					<span class="text-muted-foreground">{feed.meta.estimateTime}</span>
				{/if}
			{/if}
		{:else}
			<!-- General metadata -->
			{#if feed.meta?.priceRange}
				<span class="font-medium">{feed.meta.priceRange}</span>
			{/if}
			{#if feed.meta?.estimateTime}
				<span class="text-muted-foreground">{feed.meta.estimateTime}</span>
			{/if}
		{/if}
	</div>
{/if}
