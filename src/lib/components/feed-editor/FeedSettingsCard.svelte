<script lang="ts">
	// Shadcn-svelte components
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Switch } from '$lib/components/ui/switch';

	let { feed: feedProp, debouncedSave: debouncedSaveProp } = $props();

	// Create local state for meta editing
	let editorMeta = $state({
		article: {
			keywords: '',
			author: '',
			links: ''
		},
		service: {
			links: '',
			priceRange: '',
			estimateTime: ''
		},
		product: {
			links: '',
			price: ''
		}
	});

	// Create state for local type selection to handle Select binding
	let localFeedType = $state('');

	// Create state for local language selection to handle Select binding
	let localFeedLanguage = $state('');

	// Create derived content for Select trigger
	const feedTypeOptions = [
		{ value: 'article', label: 'Article' },
		{ value: 'product', label: 'Product' },
		{ value: 'service', label: 'Service' },
		{ value: 'custom', label: 'Custom' }
	];

	// Available language options based on the paraglide setup
	const feedLanguageOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'zh', label: '中文' },
		{ value: 'ru', label: 'Русский' }
	];

	// Use $derived to create trigger content
	const triggerContent = $derived(
		feedTypeOptions.find((option) => option.value === localFeedType)?.label ?? 'Select a type'
	);

	// Use $derived to create language trigger content
	const languageTriggerContent = $derived(
		feedLanguageOptions.find((option) => option.value === localFeedLanguage)?.label ??
			'Select a language'
	);

	// Initialize local type when feed changes
	$effect(() => {
		if (feedProp?.type && feedProp.type !== localFeedType) {
			localFeedType = feedProp.type;
		}
	});

	// Initialize local language when feed changes
	$effect(() => {
		if (feedProp?.language && feedProp.language !== localFeedLanguage) {
			localFeedLanguage = feedProp.language;
		}
	});

	// Handle type change from user selection
	function handleTypeChange(newType: string) {
		localFeedType = newType;
		if (feedProp && newType && newType !== feedProp.type) {
			feedProp.type = newType;
			debouncedSaveProp();
		}
	}

	// Handle language change from user selection
	function handleLanguageChange(newLanguage: string) {
		localFeedLanguage = newLanguage;
		if (feedProp && newLanguage && newLanguage !== feedProp.language) {
			feedProp.language = newLanguage;
			debouncedSaveProp();
		}
	}

	// Synchronize meta fields when feed type changes
	$effect(() => {
		if (feedProp?.type && feedProp.meta) {
			const meta: any = feedProp.meta;

			// Populate appropriate meta fields based on the current type
			if (feedProp.type === 'article' && feedProp.meta) {
				if (Array.isArray(feedProp.meta.keywords)) {
					editorMeta.article.keywords = feedProp.meta.keywords.join(', ');
				} else if (typeof feedProp.meta.keywords === 'string') {
					editorMeta.article.keywords = feedProp.meta.keywords;
				}
				if (typeof feedProp.meta.author === 'string') {
					editorMeta.article.author = feedProp.meta.author;
				}
				if (Array.isArray(feedProp.meta.links)) {
					editorMeta.article.links = feedProp.meta.links.join(', ');
				} else if (typeof feedProp.meta.links === 'string') {
					editorMeta.article.links = feedProp.meta.links;
				}
			} else if (feedProp.type === 'service' && feedProp.meta) {
				if (Array.isArray(feedProp.meta.service?.links)) {
					editorMeta.service.links = feedProp.meta.service.links.join(', ');
				} else if (typeof feedProp.meta.service?.links === 'string') {
					editorMeta.service.links = feedProp.meta.service.links;
				}
				if (typeof feedProp.meta.service?.priceRange === 'string') {
					editorMeta.service.priceRange = feedProp.meta.service.priceRange;
				}
				if (typeof feedProp.meta.service?.estimateTime === 'string') {
					editorMeta.service.estimateTime = feedProp.meta.service.estimateTime;
				}
			} else if ((feedProp.type === 'product' || feedProp.type === 'custom') && feedProp.meta) {
				if (Array.isArray(feedProp.meta.product?.links)) {
					editorMeta.product.links = feedProp.meta.product.links.join(', ');
				} else if (typeof feedProp.meta.product?.links === 'string') {
					editorMeta.product.links = feedProp.meta.product.links;
				}
				if (
					typeof feedProp.meta.product?.price === 'number' ||
					typeof feedProp.meta.product?.price === 'string'
				) {
					editorMeta.product.price = String(feedProp.meta.product.price);
				}
			}
		}
	});

	// Update article meta in feed
	const updateArticleMeta = () => {
		if (!feedProp) return;

		const keywordsArray = editorMeta.article.keywords
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s);
		const linksArray = editorMeta.article.links
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s);

		// Preserve existing meta properties and only update article-specific ones
		feedProp.meta = {
			...feedProp.meta,
			keywords: keywordsArray,
			author: editorMeta.article.author,
			links: linksArray
		};

		debouncedSaveProp();
	};

	// Update service meta in feed
	const updateServiceMeta = () => {
		if (!feedProp) return;

		const linksArray = editorMeta.service.links
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s);

		// Preserve existing meta properties and only update service-specific ones
		feedProp.meta = {
			...feedProp.meta,
			service: {
				...feedProp.meta?.service, // Preserve other service properties if they exist
				links: linksArray,
				priceRange: editorMeta.service.priceRange,
				estimateTime: editorMeta.service.estimateTime
			}
		};

		debouncedSaveProp();
	};

	// Update product meta in feed
	const updateProductMeta = () => {
		if (!feedProp) return;

		const linksArray = editorMeta.product.links
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s);
		const priceNumber = parseFloat(editorMeta.product.price) || 0;

		// Preserve existing meta properties and only update product-specific ones
		feedProp.meta = {
			...feedProp.meta,
			product: {
				...feedProp.meta?.product, // Preserve other product properties if they exist
				links: linksArray,
				price: priceNumber
			}
		};

		debouncedSaveProp();
	};

	// Simple function to handle meta updates with JSON validation for fallback
	function updateMeta(metaString: string) {
		try {
			// Parse the JSON to validate it
			const parsedMeta = metaString.trim() ? JSON.parse(metaString) : {};
			if (feedProp) {
				feedProp.meta = parsedMeta;
				debouncedSaveProp();
			}
		} catch (error) {
			console.error('Invalid JSON in meta field:', error);
			// Don't update if JSON is invalid
		}
	}
</script>

<Card.Root class="mb-6">
	<Card.Header>
		<Card.Title>Feed Settings</Card.Title>
		<Card.Description>Configure your feed settings</Card.Description>
	</Card.Header>

	<Card.Content>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Select.Root
					type="single"
					value={localFeedType}
					onValueChange={(value) => {
						if (value) handleTypeChange(value);
					}}
				>
					<Select.Trigger class="w-45">
						{triggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Feed Type</Select.Label>
							{#each feedTypeOptions as option (option.value)}
								<Select.Item value={option.value} label={option.label}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<Label for="feed-type-select" class="text-sm text-muted-foreground">Feed Type</Label>
			</div>

			<div class="space-y-2">
				<Select.Root
					type="single"
					value={localFeedLanguage}
					onValueChange={(value) => {
						if (value) handleLanguageChange(value);
					}}
				>
					<Select.Trigger class="w-45">
						{languageTriggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Feed Language</Select.Label>
							{#each feedLanguageOptions as option (option.value)}
								<Select.Item value={option.value} label={option.label}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<Label for="feed-language-select" class="text-sm text-muted-foreground">Feed Language</Label
				>
			</div>

			<div class="space-y-2">
				<div class="flex items-center space-x-2">
					<Switch
						checked={feedProp.public}
						onclick={() => {
							feedProp.public = !feedProp.public;
							debouncedSaveProp();
						}}
					/>
					<Label
						for="public-toggle"
						class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Public
					</Label>
				</div>
				<p class="text-sm text-muted-foreground">Make this feed publicly accessible</p>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4">
			<!-- Feed Type Specific Meta Editor -->
			<div class="space-y-4">
				<Label class="text-sm font-semibold">Meta Information</Label>
				<p class="text-sm text-muted-foreground">Enter metadata specific to your feed type</p>

				{#if localFeedType === 'article'}
					<!-- Article Meta Fields -->
					<div class="space-y-3">
						<div class="space-y-2">
							<Label for="meta-keywords" class="text-sm">Keywords</Label>
							<Input
								id="meta-keywords"
								type="text"
								bind:value={editorMeta.article.keywords}
								oninput={() => {
									updateArticleMeta();
								}}
								placeholder="Enter keywords separated by commas"
								class="w-full"
							/>
						</div>

						<div class="space-y-2">
							<Label for="meta-author" class="text-sm">Author</Label>
							<Input
								id="meta-author"
								type="text"
								bind:value={editorMeta.article.author}
								oninput={() => {
									updateArticleMeta();
								}}
								placeholder="Enter author name"
								class="w-full"
							/>
						</div>

						<div class="space-y-2">
							<Label for="meta-links" class="text-sm">Links</Label>
							<Input
								id="meta-links"
								type="text"
								bind:value={editorMeta.article.links}
								oninput={() => {
									updateArticleMeta();
								}}
								placeholder="Enter links separated by commas"
								class="w-full"
							/>
						</div>
					</div>
				{:else if localFeedType === 'service'}
					<!-- Service Meta Fields -->
					<div class="space-y-3">
						<div class="space-y-2">
							<Label for="service-links" class="text-sm">Links</Label>
							<Input
								id="service-links"
								type="text"
								bind:value={editorMeta.service.links}
								oninput={() => {
									updateServiceMeta();
								}}
								placeholder="Enter links separated by commas"
								class="w-full"
							/>
						</div>

						<div class="space-y-2">
							<Label for="service-price-range" class="text-sm">Price Range</Label>
							<Input
								id="service-price-range"
								type="text"
								bind:value={editorMeta.service.priceRange}
								oninput={() => {
									updateServiceMeta();
								}}
								placeholder="e.g., $100 - $500"
								class="w-full"
							/>
						</div>

						<div class="space-y-2">
							<Label for="service-estimate-time" class="text-sm">Estimate Time</Label>
							<Input
								id="service-estimate-time"
								type="text"
								bind:value={editorMeta.service.estimateTime}
								oninput={() => {
									updateServiceMeta();
								}}
								placeholder="e.g., 2-3 weeks"
								class="w-full"
							/>
						</div>
					</div>
				{:else if localFeedType === 'product' || localFeedType === 'custom'}
					<!-- Product/Custom Meta Fields -->
					<div class="space-y-3">
						<div class="space-y-2">
							<Label for="product-links" class="text-sm">Links</Label>
							<Input
								id="product-links"
								type="text"
								bind:value={editorMeta.product.links}
								oninput={() => {
									updateProductMeta();
								}}
								placeholder="Enter links separated by commas"
								class="w-full"
							/>
						</div>

						<div class="space-y-2">
							<Label for="product-price" class="text-sm">Price</Label>
							<Input
								id="product-price"
								type="number"
								bind:value={editorMeta.product.price}
								oninput={() => {
									updateProductMeta();
								}}
								placeholder="Enter price"
								class="w-full"
							/>
						</div>
					</div>
				{:else}
					<!-- Fallback to JSON input for other types -->
					<div class="space-y-2">
						<Input
							id="meta-json-input"
							type="text"
							value={feedProp.meta ? JSON.stringify(feedProp.meta) : '{}'}
							oninput={(e: Event) => {
								const value = ((e as InputEvent).target as HTMLInputElement).value;
								updateMeta(value);
							}}
							placeholder={JSON.stringify({ key: 'value' })}
							class="w-full"
						/>
						<Label for="meta-json-input" class="text-sm text-muted-foreground">Meta (JSON)</Label>
					</div>
				{/if}
			</div>
		</div>
	</Card.Content>
</Card.Root>
