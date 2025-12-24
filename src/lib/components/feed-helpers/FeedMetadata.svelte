<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import LinkIcon from '@lucide/svelte/icons/link';
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

	const { feed, viewMode = 'list' } = $props<{ feed: Feed | any; viewMode?: 'list' | 'detail' }>();

	// Helper function to format date
	function formatDate(date: number): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

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

	// Helper function to extract domain from URL
	function extractDomain(url: string): string {
		try {
			const parsedUrl = new URL(url);
			return parsedUrl.hostname;
		} catch (error) {
			// If URL parsing fails, return the original URL as fallback
			return url;
		}
	}

	// Check if metadata exists to determine if we should show the section
	const hasMetadata = $derived(
		!!(
			feed?.meta &&
			// Check for article metadata
			((feed.type === 'article' &&
				(feed.meta.keywords?.length || feed.meta.author || feed.meta.links?.length)) ||
				// Check for product metadata
				((feed.type === 'product' || feed.type === 'custom') &&
					(feed.meta.product?.links?.length ||
						feed.meta.product?.price !== undefined ||
						feed.meta.links?.length ||
						feed.meta.price !== undefined)) ||
				// Check for service metadata
				(feed.type === 'service' &&
					(feed.meta.service?.links?.length ||
						feed.meta.service?.priceRange ||
						feed.meta.service?.estimateTime ||
						feed.meta.links?.length ||
						feed.meta.priceRange ||
						feed.meta.estimateTime)) ||
				// For other types, check if there's any meta data
				(feed.meta && Object.keys(feed.meta).length > 0))
		)
	);
</script>

{#if hasMetadata}
	{#if viewMode === 'list'}
		<Card.Root class="mt-4 bg-muted/20 p-4">
			<Card.Header class="p-0">
				<Card.Title class="flex items-center gap-2 text-sm font-medium">
					<span>Metadata</span>
					{#if feed.type}
						<Badge variant="secondary" class="text-xs">
							{feed.type}
						</Badge>
					{/if}
				</Card.Title>
			</Card.Header>

			<Card.Content class="mt-2 space-y-3 p-0">
				{#if feed.type === 'article'}
					<!-- Article-specific metadata -->
					{#if feed.meta?.keywords?.length}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Keywords</p>
							<div class="flex flex-wrap gap-1">
								{#each feed.meta.keywords as keyword, i}
									{#if keyword && keyword.trim()}
										<Badge variant="outline" class="text-xs">
											{keyword}
										</Badge>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					{#if feed.meta?.author}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Author</p>
							<p class="text-sm">{feed.meta.author}</p>
						</div>
					{/if}

					<!-- Timestamps section -->
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Created</p>
						<p class="text-sm">{formatDate(feed.createdAt)}</p>
						{#if feed.updatedAt}
							<p class="mt-1 text-xs font-medium text-muted-foreground">Updated</p>
							<p class="text-sm">{formatDate(feed.updatedAt)}</p>
						{/if}
					</div>

					{#if feed.meta?.links?.length}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Links</p>
							<div class="space-y-1">
								{#each feed.meta.links as link, i}
									{#if link && link.trim()}
										<a
											href={link}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm break-all text-primary hover:underline flex items-center"
										>
											<LinkIcon class="w-3 h-3 inline mr-1" />
											{extractDomain(link)}
										</a>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				{:else if feed.type === 'product' || feed.type === 'custom'}
					<!-- Product-specific metadata -->
					{#if feed.meta?.author}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Author</p>
							<p class="text-sm">{feed.meta.author}</p>
						</div>
					{/if}

					{#if feed.meta?.product?.links?.length}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Links</p>
							<div class="space-y-1">
								{#each feed.meta.product.links as link, i}
									{#if link && link.trim()}
										<a
											href={link}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm break-all text-primary hover:underline flex items-center"
										>
											<LinkIcon class="w-3 h-3 inline mr-1" />
											{extractDomain(link)}
										</a>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					{#if feed.meta?.product?.price !== undefined}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Price</p>
							<p class="text-sm font-medium">{formatPrice(feed.meta.product.price)}</p>
						</div>
					{/if}

					{#if !feed.meta?.product?.links?.length && !feed.meta?.product?.price && feed.meta?.links?.length}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Links</p>
							<div class="space-y-1">
								{#each feed.meta.links as link, i}
									{#if link && link.trim()}
										<a
											href={link}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm break-all text-primary hover:underline flex items-center"
										>
											<LinkIcon class="w-3 h-3 inline mr-1" />
											{extractDomain(link)}
										</a>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					{#if !feed.meta?.product?.price && feed.meta?.price !== undefined}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Price</p>
							<p class="text-sm font-medium">{formatPrice(feed.meta.price)}</p>
						</div>
					{/if}
				{:else if feed.type === 'service'}
					<!-- Service-specific metadata -->
					{#if feed.meta?.author}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Author</p>
							<p class="text-sm">{feed.meta.author}</p>
						</div>
					{/if}

					{#if feed.meta?.service?.links?.length}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Links</p>
							<div class="space-y-1">
								{#each feed.meta.service.links as link, i}
									{#if link && link.trim()}
										<a
											href={link}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm break-all text-primary hover:underline flex items-center"
										>
											<LinkIcon class="w-3 h-3 inline mr-1" />
											{extractDomain(link)}
										</a>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					{#if feed.meta?.service?.priceRange}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Price Range</p>
							<p class="text-sm">{feed.meta.service.priceRange}</p>
						</div>
					{/if}

					{#if feed.meta?.service?.estimateTime}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Estimate Time</p>
							<p class="text-sm">{feed.meta.service.estimateTime}</p>
						</div>
					{/if}

					<!-- Handle case where service metadata is at the root level -->
				{:else}
					{#if feed.meta?.author}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Author</p>
							<p class="text-sm">{feed.meta.author}</p>
						</div>
					{/if}

					{#if feed.meta?.links?.length}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Links</p>
							<div class="space-y-1">
								{#each feed.meta.links as link, i}
									{#if link && link.trim()}
										<a
											href={link}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm break-all text-primary hover:underline flex items-center"
										>
											<LinkIcon class="w-3 h-3 inline mr-1" />
											{extractDomain(link)}
										</a>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					{#if feed.meta?.priceRange}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Price Range</p>
							<p class="text-sm">{feed.meta.priceRange}</p>
						</div>
					{/if}

					{#if feed.meta?.estimateTime}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Estimate Time</p>
							<p class="text-sm">{feed.meta.estimateTime}</p>
						</div>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="mt-2 space-y-3">
			{#if feed.type === 'article'}
				<!-- Article-specific metadata -->
				{#if feed.meta?.keywords?.length}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Keywords</p>
						<div class="flex flex-wrap gap-1">
							{#each feed.meta.keywords as keyword, i}
								{#if keyword && keyword.trim()}
									<Badge variant="outline" class="text-xs">
										{keyword}
									</Badge>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				{#if feed.meta?.author}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Author</p>
						<p class="text-sm">{feed.meta.author}</p>
					</div>
				{/if}

				<!-- Timestamps section -->
				<div class="space-y-1">
					<p class="text-xs font-medium text-muted-foreground">Created</p>
					<p class="text-sm">{formatDate(feed.createdAt)}</p>
					{#if feed.updatedAt}
						<p class="mt-1 text-xs font-medium text-muted-foreground">Updated</p>
						<p class="text-sm">{formatDate(feed.updatedAt)}</p>
					{/if}
				</div>

				{#if feed.meta?.links?.length}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Links</p>
						<div class="space-y-1">
							{#each feed.meta.links as link, i}
								{#if link && link.trim()}
									<a
										href={link}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm break-all text-primary hover:underline flex items-center"
									>
										<LinkIcon class="w-3 h-3 inline mr-1" />
										{extractDomain(link)}
									</a>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{:else if feed.type === 'product' || feed.type === 'custom'}
				<!-- Product-specific metadata -->
				{#if feed.meta?.author}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Author</p>
						<p class="text-sm">{feed.meta.author}</p>
					</div>
				{/if}

				{#if feed.meta?.product?.links?.length}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Links</p>
						<div class="space-y-1">
							{#each feed.meta.product.links as link, i}
								{#if link && link.trim()}
									<a
										href={link}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm break-all text-primary hover:underline flex items-center"
									>
										<LinkIcon class="w-3 h-3 inline mr-1" />
										{extractDomain(link)}
									</a>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				{#if feed.meta?.product?.price !== undefined}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Price</p>
						<p class="text-sm font-medium">{formatPrice(feed.meta.product.price)}</p>
					</div>
				{/if}

				{#if !feed.meta?.product?.links?.length && !feed.meta?.product?.price && feed.meta?.links?.length}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Links</p>
						<div class="space-y-1">
							{#each feed.meta.links as link, i}
								{#if link && link.trim()}
									<a
										href={link}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm break-all text-primary hover:underline flex items-center"
									>
										<LinkIcon class="w-3 h-3 inline mr-1" />
										{extractDomain(link)}
									</a>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				{#if !feed.meta?.product?.price && feed.meta?.price !== undefined}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Price</p>
						<p class="text-sm font-medium">{formatPrice(feed.meta.price)}</p>
					</div>
				{/if}
			{:else if feed.type === 'service'}
				<!-- Service-specific metadata -->
				{#if feed.meta?.author}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Author</p>
						<p class="text-sm">{feed.meta.author}</p>
					</div>
				{/if}

				{#if feed.meta?.service?.links?.length}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Links</p>
						<div class="space-y-1">
							{#each feed.meta.service.links as link, i}
								{#if link && link.trim()}
									<a
										href={link}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm break-all text-primary hover:underline flex items-center"
									>
										<LinkIcon class="w-3 h-3 inline mr-1" />
										{extractDomain(link)}
									</a>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				{#if feed.meta?.service?.priceRange}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Price Range</p>
						<p class="text-sm">{feed.meta.service.priceRange}</p>
					</div>
				{/if}

				{#if feed.meta?.service?.estimateTime}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Estimate Time</p>
						<p class="text-sm">{feed.meta.service.estimateTime}</p>
					</div>
				{/if}

				<!-- Handle case where service metadata is at the root level -->
			{:else}
				{#if feed.meta?.author}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Author</p>
						<p class="text-sm">{feed.meta.author}</p>
					</div>
				{/if}

				{#if feed.meta?.links?.length}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Links</p>
						<div class="space-y-1">
							{#each feed.meta.links as link, i}
								{#if link && link.trim()}
									<a
										href={link}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm break-all text-primary hover:underline flex items-center"
									>
										<LinkIcon class="w-3 h-3 inline mr-1" />
										{extractDomain(link)}
									</a>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				{#if feed.meta?.priceRange}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Price Range</p>
						<p class="text-sm">{feed.meta.priceRange}</p>
					</div>
				{/if}

				{#if feed.meta?.estimateTime}
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground">Estimate Time</p>
						<p class="text-sm">{feed.meta.estimateTime}</p>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
{/if}
