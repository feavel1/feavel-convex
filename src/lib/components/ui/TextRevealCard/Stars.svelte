<script lang="ts">
	import { Motion } from 'svelte-motion';
	let randomMove = () => Math.random() * 4 - 2;
</script>

<div class="absolute inset-0 z-40">
	{#each [...Array(100)] as _, i (`star-${i}`)}
		<Motion
			let:motion
			animate={{
				top: `calc(${Math.random() * 100}% + ${randomMove()}px)`,
				left: `calc(${Math.random() * 100}% + ${randomMove()}px)`,
				opacity: Math.random(),
				scale: [1, 1.2, 0]
			}}
			transition={{
				duration: Math.random() * 10 + 20,
				repeat: Infinity,
				ease: 'linear'
			}}
		>
			<span
				use:motion
				class="z-50 inline-block"
				style={`position: absolute; width: 2px; height: 2px; background-color: white; border-radius: 50%; top: ${Math.random() * 100}%; left: ${Math.random() * 100}%; z-index: 1;`}
			></span>
		</Motion>
	{/each}
</div>
