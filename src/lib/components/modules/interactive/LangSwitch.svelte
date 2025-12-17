<script lang="ts">
	import { locales as availableLanguageTags } from '$lib/paraglide/runtime.js';
	import { setLocale, getLocale } from '$lib/paraglide/runtime.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Globe } from '@lucide/svelte';

	// Language mapping with flag emojis and full names
	const languageInfo = {
		'en': { name: 'English', flag: '🇺🇸' },
		'zh': { name: '中文', flag: '🇨🇳' },
		'ru': { name: 'Русский', flag: '🇷🇺' }
	};

	// Get the current locale
	let currentLocale = $state(getLocale());

	async function switchLanguage(lang: 'en' | 'zh' | 'ru') {
		// Set the new locale
		await setLocale(lang);
		// Update the current locale state
		currentLocale = lang;
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon">
				<Globe class="size-4" />
				<span class="sr-only">Switch language</span>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-40">
		{#each availableLanguageTags as lang}
			<DropdownMenu.Item
				onclick={() => switchLanguage(lang)}
				class={lang === currentLocale ? 'bg-accent' : ''}
			>
				<div class="flex items-center gap-2">
					<span class="text-sm">{languageInfo[lang].flag}</span>
					<span class="font-medium">{languageInfo[lang].name}</span>
				</div>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
