<script lang="ts">
	import { Motion, AnimatePresence, useViewportScroll } from 'svelte-motion';
	import { cn } from '$lib/utils.js';
	import { Home, User, MessageCircle, LogIn } from '@lucide/svelte';
	import type { ComponentType } from 'svelte';
	import Button from '../button/button.svelte';
	import ModeSwitch from '$lib/components/modules/interactive/ModeSwitch.svelte';
	import LangSwitch from '$lib/components/modules/interactive/LangSwitch.svelte';

	const { scrollYProgress } = useViewportScroll();

	let visible = false;

	$: ($scrollYProgress, updateDirection());

	const navItems = [
		{
			name: 'Home',
			link: '/',
			icon: Home
		},
		{
			name: 'Feed',
			link: '/feed',
			icon: MessageCircle
		},
		{
			name: 'About',
			link: '/about',

			icon: User
		}
	];

	function updateDirection() {
		// console.log($scrollYProgress);

		let direction = $scrollYProgress - scrollYProgress.getPrevious();
		// console.log(direction);

		if (scrollYProgress.get() < 0) {
			visible = false;
		} else {
			if (direction < 0) {
				visible = true;
			} else {
				visible = false;
			}
		}
	}
</script>

<AnimatePresence show={true}>
	<Motion
		let:motion
		initial={{
			opacity: 1,
			y: -100
		}}
		animate={{
			y: visible ? 0 : -100,
			opacity: visible ? 1 : 0
		}}
		transition={{
			duration: 0.2
		}}
	>
		<div
			use:motion
			class={cn(
				'fixed inset-x-0 top-6 z-10 mx-auto flex max-w-fit items-center justify-center space-x-4 rounded-full border border-transparent bg-gray-100 py-2 pr-2 pl-2 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] dark:border-white/[0.2] dark:bg-black'
			)}
		>
			{#each navItems as navItem, idx (`link=${idx}`)}
				<Button variant="ghost" href={navItem.link} class="rounded-2xl">
					<svelte:component
						this={navItem.icon}
						class="block h-4 w-4 text-neutral-500 sm:hidden dark:text-white"
					/>
					<span class="hidden text-sm sm:block">{navItem.name}</span>
				</Button>
			{/each}
			<ModeSwitch />
			<LangSwitch />
			<Button
				href="/auth/sign-up"
				class="relative rounded-full border border-neutral-500 text-sm font-medium  dark:border-red-600 "
			>
				<LogIn />
				<span class="hidden text-sm sm:block">Account</span>
				<!-- <span
					class="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
				></span> -->
			</Button>
		</div>
	</Motion>
</AnimatePresence>
