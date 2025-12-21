<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
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
	import { Computer, FileSignature, Music, ToolCase } from '@lucide/svelte';

	const items = [
		{
			title: m.stock_trite_thrush_launch(),
			description: m.brave_watery_ibex_grow(),
			className: 'md:col-span-2',
			icon: Computer
		},
		{
			title: m.shy_bright_jurgen_work(),
			description: m.wacky_tired_snake_dance(),
			className: 'md:col-span-1',
			icon: Music
		},
		{
			title: m.grassy_weak_seal_exhale(),
			description: m.this_yummy_robin_push(),
			className: 'md:col-span-1',
			icon: FileSignature
		},
		{
			title: m.inner_nimble_hawk_jump(),
			description: m.only_game_baboon_ripple(),
			className: 'md:col-span-2',
			icon: ToolCase
		}
	];
</script>

<!-- Hero Section -->
<LampEffect>
	<h1
		id="hero-heading"
		class="animate-fade-in-up mt-8 bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text py-4 text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
	>
		{m.royal_fit_hamster_roar()}
	</h1>
</LampEffect>

<!-- Highlights Section -->
<section class="py-20" aria-labelledby="highlights-heading">
	<div class="container mx-auto max-w-4xl px-4">
		<div class="mb-16 text-center">
			<h2 id="highlights-heading" class="mb-4 text-3xl font-bold md:text-4xl">
				{m.heroic_day_mantis_fry()}
			</h2>
			<p class="mx-auto max-w-2xl text-muted-foreground">
				{m.busy_heroic_marlin_ask()}
			</p>
		</div>

		<div class="flex flex-col items-center justify-center gap-6 md:flex-row">
			<GlowingStarsBackgroundCard className="max-w-sm">
				<GlowingStarsTitle>💁 {m.swift_awful_otter_find()}</GlowingStarsTitle>
				<div class="flex items-end justify-between">
					<GlowingStarsDescription>
						{m.teary_candid_impala_treasure()}
					</GlowingStarsDescription>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-[hsla(0,0%,100%,.1)]"
					>
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
				<Icon class="absolute -top-3 -left-3 h-6 w-6 text-black dark:text-white" />
				<Icon class="absolute -bottom-3 -left-3 h-6 w-6 text-black dark:text-white" />
				<Icon class="absolute -top-3 -right-3 h-6 w-6 text-black dark:text-white" />
				<Icon class="absolute -right-3 -bottom-3 h-6 w-6 text-black dark:text-white" />

				<EvervaultCard text="Hover" />

				<h3 class="mt-6 text-lg font-medium text-black dark:text-white">
					🎁 {m.direct_fluffy_crossbill_race()}
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

<!-- Articles Section -->
<section
	class="bg-linear-to-b from-transparent to-slate-50 py-20 dark:to-slate-900/10"
	aria-labelledby="articles-heading"
>
	<div class="container mx-auto px-4">
		<div class="mb-16 text-center">
			<h2 id="articles-heading" class="mb-4 text-3xl font-bold md:text-4xl">
				{m.white_mild_lionfish_enchant()}
			</h2>
			<p class="mx-auto max-w-2xl text-muted-foreground">
				{m.low_teal_cougar_tear()}
			</p>
		</div>

		<BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
			{#each items as item, i (i)}
				<BentoGridItem title={item.title} description={item.description} className={item.className}>
					<div
						slot="header"
						class="bg-dot-black/[0.2] dark:bg-dot-white/[0.2] flex h-full min-h-[6rem] w-full flex-1 rounded-xl border border-transparent bg-neutral-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:border-white/[0.2] dark:bg-black"
					></div>
					<svelte:component this={item.icon} slot="icon" class="h-4 w-4 text-neutral-500" />
				</BentoGridItem>
			{/each}
		</BentoGrid>
	</div>
</section>

<!-- CTA Section -->
<section
	class="h-[70vh] bg-linear-to-t from-transparent to-slate-50/10 py-20"
	aria-labelledby="cta-heading"
>
	<div class="container mx-auto max-w-2xl px-4">
		<div class="mb-16 text-center">
			<h2 id="cta-heading" class="mb-4 text-3xl font-bold md:text-4xl">
				{m.slimy_zesty_husky_splash()}
			</h2>
			<p class="mx-auto max-w-xl text-muted-foreground">
				{m.light_whole_toad_peek()}
			</p>
		</div>

		<div class="flex justify-center">
			<TextRevealCard
				text="Explore web dev, music & research content"
				revealText="Discover articles, services & products!"
			>
				<TextRevealCardTitle>{m.ok_plain_hyena_tickle()}</TextRevealCardTitle>
				<TextRevealCardDescription>
					{m.spare_agent_lobster_leap()}
				</TextRevealCardDescription>
			</TextRevealCard>
		</div>
	</div>
</section>

<Sparkles />

<!-- <section class="relative py-20 md:py-32" aria-labelledby="hero-heading">
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

	</div>
</section> -->

<style>
	@keyframes fadeInUp {
		0% {
			opacity: 0.5;
			transform: translateY(100px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fadeInUp 0.8s cubic-bezier(0.455, 0.03, 0.515, 0.955) 0.3s both;
	}
</style>
