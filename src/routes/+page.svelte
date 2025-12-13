<script lang="ts">
    import BentoGrid from '$lib/components/ui/BentoGrid/BentoGrid.svelte';
    import BentoGridItem from '$lib/components/ui/BentoGrid/BentoGridItem.svelte';
    import EvervaultCard from '$lib/components/ui/EvervaultCard/EvervaultCard.svelte';
    import Icon from '$lib/components/ui/EvervaultCard/Icon.svelte';
    import GlowingStarsBackgroundCard from '$lib/components/ui/GlowingStars/GlowingStarsBackgroundCard.svelte';
    import GlowingStarsDescription from '$lib/components/ui/GlowingStars/GlowingStarsDescription.svelte';
    import GlowingStarsTitle from '$lib/components/ui/GlowingStars/GlowingStarsTitle.svelte';
    import LampEffect from '$lib/components/ui/LampEffect/LampEffect.svelte';
    import Sparkles from '$lib/components/ui/Sparkles/Sparkles.svelte';
    import TextRevealCard from '$lib/components/ui/TextRevealCard/TextRevealCard.svelte';
    import TextRevealCardDescription from '$lib/components/ui/TextRevealCard/TextRevealCardDescription.svelte';
    import TextRevealCardTitle from '$lib/components/ui/TextRevealCard/TextRevealCardTitle.svelte';
    import { Motion } from 'svelte-motion';
    import { ClipboardCopy, File, FileSignature, Table } from '@lucide/svelte';

	const items = [
		{
			title: 'The Dawn of Innovation',
			description: 'Explore the birth of groundbreaking ideas and inventions.',
			className: 'md:col-span-2',
			icon: ClipboardCopy
		},
		{
			title: 'The Digital Revolution',
			description: 'Dive into the transformative power of technology.',
			className: 'md:col-span-1',
			icon: File
		},
		{
			title: 'The Art of Design',
			description: 'Discover the beauty of thoughtful and functional design.',
			className: 'md:col-span-1',
			icon: FileSignature
		},
		{
			title: 'The Power of Communication',
			description: 'Understand the impact of effective communication in our lives.',
			className: 'md:col-span-2',
			icon: Table
		}
	];

	const words = [
			{
				text: 'Build'
			},
			{
				text: 'awesome'
			},
			{
				text: 'apps'
			},
			{
				text: 'with'
			},
			{
				text: 'Aceternity.',
				className: 'text-blue-500 dark:text-blue-500'
			}
		];
</script>

<!-- Hero Section -->
<LampEffect>
	<Motion
		let:motion
		initial={{ opacity: 0.5, y: 100 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{
			delay: 0.3,
			duration: 0.8,
			ease: 'easeInOut'
		}}
	>
		<h1
			id="hero-heading"
			use:motion
			class="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text py-4 text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
		>
			Build web 🕸️ <br /> the right way
		</h1>
	</Motion>
</LampEffect>



<!-- Features Section -->
<section class="py-20 bg-linear-to-b from-transparent to-slate-50 dark:to-slate-900/10" aria-labelledby="features-heading">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<h2 id="features-heading" class="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
			<p class="text-muted-foreground max-w-2xl mx-auto">Discover the powerful features that make our platform stand out</p>
		</div>

		<BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
			{#each items as item, i (i)}
				<BentoGridItem title={item.title} description={item.description} className={item.className}>
					<div
						slot="header"
						class="flex h-full min-h-[6rem] w-full flex-1 rounded-xl border border-transparent bg-neutral-100 bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:border-white/[0.2] dark:bg-black dark:bg-dot-white/[0.2]"
					></div>
					<svelte:component this={item.icon} slot="icon" class="h-4 w-4 text-neutral-500" />
				</BentoGridItem>
			{/each}
		</BentoGrid>
	</div>
</section>

<!-- Highlights Section -->
<section class="py-20" aria-labelledby="highlights-heading">
	<div class="container mx-auto px-4 max-w-4xl">
		<div class="text-center mb-16">
			<h2 id="highlights-heading" class="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
			<p class="text-muted-foreground max-w-2xl mx-auto">Experience the power of modern web technologies</p>
		</div>

		<div class="flex flex-col items-center gap-6 justify-center md:flex-row">
		 <GlowingStarsBackgroundCard className="max-w-sm">
			<GlowingStarsTitle>Svelte + Convex</GlowingStarsTitle>
			<div class="flex items-end justify-between">
				<GlowingStarsDescription>
					The power of full-stack to the frontend.
				</GlowingStarsDescription>
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-[hsla(0,0%,100%,.1)]">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-4 w-4 stroke-2 text-white"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
						/>
					</svg>
				</div>
			</div>
			</GlowingStarsBackgroundCard>

		<div
			class="relative mx-auto flex h-[30rem] max-w-sm flex-col items-start border border-black/[0.2] p-6 dark:border-white/[0.2]"
		>
			<Icon class="absolute -left-3 -top-3 h-6 w-6 text-black dark:text-white" />
			<Icon class="absolute -bottom-3 -left-3 h-6 w-6 text-black dark:text-white" />
			<Icon class="absolute -right-3 -top-3 h-6 w-6 text-black dark:text-white" />
			<Icon class="absolute -bottom-3 -right-3 h-6 w-6 text-black dark:text-white" />

			<EvervaultCard text="hover" />

			<h3 class="mt-6 text-lg font-medium text-black dark:text-white">
				Hover over this card to reveal an awesome effect.
			</h3>
			<!-- <p
				class="mt-4 rounded-full border border-black/[0.2] px-3 py-1 text-sm font-light text-black dark:border-white/[0.2] dark:text-white"
			>
				Watch me hover
			</p> -->
		</div>
		</div>

	</div>
</section>


<!-- CTA Section -->
<section class="py-20 bg-slate-50" aria-labelledby="cta-heading">
	<div class="container mx-auto px-4 max-w-2xl">
		<div class="text-center mb-16">
			<h2 id="cta-heading" class="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
			<p class="text-muted-foreground max-w-xl mx-auto">Unleash your creativity with our powerful platform</p>
		</div>

		<div class="flex justify-center">
			<TextRevealCard
				text="Don't know what you like or want?"
				revealText="Browse feed and see what you like!"
			>
				<TextRevealCardTitle>Begin Your Adventure</TextRevealCardTitle>
				<TextRevealCardDescription>Take the first step towards building amazing things.</TextRevealCardDescription>
			</TextRevealCard>
		</div>
	</div>
</section>

<section class="relative py-20 md:py-32" aria-labelledby="hero-heading">
	<div class="container mx-auto px-4">

		<div class="flex h-[30rem] flex-col items-center justify-center mt-12">
			<p class="text-xs text-neutral-600 dark:text-neutral-200 sm:text-base mb-6">
				The road to freedom starts from here
			</p>

			<div class="flex flex-col space-x-0 space-y-4 md:flex-row md:space-x-4 md:space-y-0 mt-8">
				<button
					class="h-10 w-40 rounded-xl border border-transparent bg-black text-sm text-white dark:border-white"
				>
					Join now
				</button>
				<button class="h-10 w-40 rounded-xl border border-black bg-white text-sm text-black">
					Signup
				</button>

			</div>
		</div>
					<Sparkles />
	</div>
</section>
