<script lang="ts">
	//@ts-nocheck
	import { onMount } from 'svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import { uploadFeedFileWithClient } from './editor';

	let {
		readOnly = false,
		class: className = '',
		content = null,
		onChange,
		feedId
	} = $props();
	let editor: any = $state(null);
	let editorEl: HTMLElement;

	// Get the convex client
	const convexClient = useConvexClient();

	onMount(async () => {
		const { default: EditorJS } = await import('@editorjs/editorjs');
		const { default: Header } = await import('@editorjs/header');
		const { default: List } = await import('@editorjs/list');
		const { default: Quote } = await import('@editorjs/quote');
		const { default: CodeTool } = await import('@editorjs/code');
		const { default: InlineCode } = await import('@editorjs/inline-code');
		const { default: Delimiter } = await import('@editorjs/delimiter');
		const { default: Table } = await import('@editorjs/table');
		const { default: ImageTool } = await import('@editorjs/image');
		const { default: AudioTool } = await import('@furison-tech/editorjs-audio');
		const { default: Checklist } = await import('@editorjs/checklist');
		const { default: Marker } = await import('@editorjs/marker');
		// const { default: Attaches } = await import('@editorjs/attaches');
		const { default: Embed } = await import('@editorjs/embed');
		const { default: Link } = await import('@editorjs/link');
		const { default: Warning } = await import('@editorjs/warning');
		const { default: ColorPicker } = await import('editorjs-color-picker');
		const { default: DragDrop } = await import('editorjs-drag-drop');
		const { default: Undo } = await import('editorjs-undo');
		// const { default: MultiblockSelection } = await import('editorjs-multiblock-selection-plugin');

		editor = new EditorJS({
			holder: editorEl,
			data: content,
			readOnly,
			tools: {
				header: {
					class: Header,
					config: {
						placeholder: 'Enter a header',
						levels: [1],
						defaultLevel: 1
					}
				},
				list: List,
				checklist: Checklist,
				quote: Quote,
				marker: Marker,
				code: CodeTool,
				delimiter: Delimiter,
				inlineCode: InlineCode,
				table: Table,
				image: {
					class: ImageTool,
					config: {
						field: 'image',
						types: 'image/*',
						captionPlaceholder: 'Caption',
						buttonContent: 'Select image',
						features: {
							border: true,
							caption: true,
							stretch: true
						},
						uploader: {
							uploadByFile: async (file: File) => {
								if (!feedId) {
									throw new Error('Feed ID is required for image uploads');
								}
								// Validate that the file is an image
								if (!file.type.startsWith('image/')) {
									throw new Error('File is not a valid image');
								}
								const result = await uploadFeedFileWithClient(convexClient, file, feedId);
								if (!result) {
									throw new Error('Image upload failed');
								}
								return result;
							}
						}
					}
				},
				audio: {
					class: AudioTool,
					config: {
						field: 'audio',
						types: 'audio/*',
						buttonContent: 'Select audio file',
						uploader: {
							uploadByFile: async (file: File) => {
								if (!feedId) {
									throw new Error('Feed ID is required for audio uploads');
								}
								// Validate that the file is an audio file
								if (!file.type.startsWith('audio/')) {
									throw new Error('File is not a valid audio file');
								}
								const result = await uploadFeedFileWithClient(convexClient, file, feedId);
								if (!result) {
									throw new Error('Audio upload failed');
								}
								return result;
							}
						}
					}
				},
				embed: Embed,
				link: Link,
				warning: Warning,
				color: ColorPicker
			},
			onReady: () => {
				new Undo({ editor });
				new DragDrop(editor);
				// new MultiblockSelection();
			},
			onChange: () => {
				if (onChange && editor) {
					editor.save().then((data: any) => {
						onChange(data);
					});
				}
			}
		});

		editor.isReady
			.then(() => {
				console.log('Editor.js is ready to work!');
			})
			.catch((reason: any) => {
				console.error(`Editor.js initialization failed:`, reason);
			});
	});
</script>

<div bind:this={editorEl} class="prose rounded-lg border {className}"></div>
