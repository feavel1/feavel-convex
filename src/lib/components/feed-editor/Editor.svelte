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
	let isUpdatingFromProp = $state(false); // Flag to prevent triggering onChange when updating from prop
	let lastContentFromProp: any = $state(null); // Track the last content we received from the prop

	// Get the convex client
	const convexClient = useConvexClient();

	// Function to get current cursor position in the editor
	const getCursorPosition = async () => {
		if (!editor) return null;
		try {
			const savedData = await editor.save();
			return {
				data: savedData,
				// Note: EditorJS doesn't easily expose cursor position,
				// so we'll track the content state instead
				contentHash: JSON.stringify(savedData)
			};
		} catch (error) {
			console.error('Error getting cursor position:', error);
			return null;
		}
	};

	// Function to restore content while preserving user context as much as possible
	const restoreContent = async (newContent: any) => {
		if (!editor) return;

		try {
			// Before replacing content, try to save current state
			const currentState = await editor.save();

			// Check if content is significantly different to avoid unnecessary disruption
			const isSame = JSON.stringify(currentState) === JSON.stringify(newContent);

			if (!isSame) {
				// Set the flag to prevent triggering onChange
				isUpdatingFromProp = true;

				// For EditorJS, the most reliable way to update content is to render it completely
				// However, this does lose the cursor position. This is a limitation of EditorJS.
				await editor.render(newContent);

				// Reset the flag after update is complete
				isUpdatingFromProp = false;

				console.log('Content updated from external source');
			}
		} catch (error) {
			console.error('Error restoring content:', error);
			isUpdatingFromProp = false;
		}
	};

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

				// Store initial content to track changes
				lastContentFromProp = JSON.stringify(content);
			},
			onChange: () => {
				if (onChange && editor && !isUpdatingFromProp) {
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

	// Watch for content changes from external sources (other users)
	// Only trigger when the content prop changes and differs from what we last processed
	$effect(() => {
		if (editor && content && !isUpdatingFromProp) {
			const contentStr = JSON.stringify(content);

			// Only update if the content is actually different from what we last received
			if (lastContentFromProp !== contentStr) {
				// Compare with what's currently in the editor to avoid unnecessary updates
				editor.save().then((currentData: any) => {
					const currentDataStr = JSON.stringify(currentData);

					// If the editor content differs from the new prop content, update the editor
					if (currentDataStr !== contentStr) {
						// Store the new content to prevent processing it again
						lastContentFromProp = contentStr;

						// Update the editor with new content
						restoreContent(content);
					} else {
						// Contents are the same, just update our tracking
						lastContentFromProp = contentStr;
					}
				}).catch((error: any) => {
					console.error('Error saving editor content for comparison:', error);
					// Still update the tracking to avoid infinite loops
					lastContentFromProp = contentStr;
				});
			}
		}
	});
</script>

<div bind:this={editorEl} class="prose rounded-lg border {className}"></div>
