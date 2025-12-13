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
    import TypewriterEffectSmooth from '$lib/components/ui/TypewriterEffect/TypewriterEffectSmooth.svelte';


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

<LampEffect>
	<Motion
		let:motion
		initial={{ opacity: 0.5, y: 100 }}
		whileInView={{ opacity: 1, y: 0 }}
		transition={{
			delay: 0.3,
			duration: 0.8,
			ease: 'easeInOut'
		}}
	>
		<h2
			use:motion
			class="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text py-4 text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
		>
			Build lamps <br /> the right way
		</h2>
	</Motion>
</LampEffect>

<div class="flex h-[40rem] flex-col items-center justify-center">
	<p class="text-xs text-neutral-600 dark:text-neutral-200 sm:text-base">
		The road to freedom starts from here
	</p>
	<TypewriterEffectSmooth {words} />
	<div class="flex flex-col space-x-0 space-y-4 md:flex-row md:space-x-4 md:space-y-0">
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

<GlowingStarsBackgroundCard>
	<GlowingStarsTitle>Svelte</GlowingStarsTitle>
	<div class="flex items-end justify-between">
		<GlowingStarsDescription>
			The power of full-stack to the frontend. Read the release notes.
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
	class="relative mx-auto flex h-[30rem] max-w-sm flex-col items-start border border-black/[0.2] p-4 dark:border-white/[0.2]"
>
	<Icon class="absolute -left-3 -top-3 h-6 w-6 text-black dark:text-white" />
	<Icon class="absolute -bottom-3 -left-3 h-6 w-6 text-black dark:text-white" />
	<Icon class="absolute -right-3 -top-3 h-6 w-6 text-black dark:text-white" />
	<Icon class="absolute -bottom-3 -right-3 h-6 w-6 text-black dark:text-white" />

	<EvervaultCard text="hover" />

	<h2 class="mt-4 text-sm font-light text-black dark:text-white">
		Hover over this card to reveal an awesome effect. Running out of copy here.
	</h2>
	<p
		class="mt-4 rounded-full border border-black/[0.2] px-2 py-0.5 text-sm font-light text-black dark:border-white/[0.2] dark:text-white"
	>
		Watch me hover
	</p>
</div>

<TextRevealCard text="Previous text better by longer than reveal text" revealText="I know something">
 <TextRevealCardTitle>I need some longer text </TextRevealCardTitle>
 <TextRevealCardDescription > What to type here?</TextRevealCardDescription>
</TextRevealCard>



Some BIG text
<Sparkles />
