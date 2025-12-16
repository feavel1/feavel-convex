<script lang="ts">
  import type { PageData } from './$types';
 	import * as Code from '$lib/components/ui/code';


  // Define feed type
  interface Feed {
    _id: string;
    title: string;
    content: any; // Generic object type from Convex
    slug: string;
    type: string;
    public: boolean;
    createdBy: string;
    createdAt: number;
    updatedAt?: number;
  }

  // Define Editor.js block type
  interface EditorJSBlock {
    type: string;
    data: any;
    id?: string;
  }

  // Define Editor.js content structure
  interface EditorJSContent {
    time?: number;
    blocks: EditorJSBlock[];
    version?: string;
  }

  // Props received from the server load function
  const props = $props();
  const feed = $derived(props.data.feed);

  // Format date for display
  function formatDate(date: number): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Type guard to check if content is Editor.js format
  function isEditorJSContent(content: any): content is EditorJSContent {
    return content && Array.isArray(content.blocks);
  }
</script>

<div class="container mx-auto py-8 max-w-4xl">
  <div class="mb-8">
    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{feed.title}</h1>

    <div class="flex flex-wrap items-center text-sm text-gray-600 mb-4">
      <span class="mr-4">Created: {formatDate(feed.createdAt)}</span>
      {#if feed.updatedAt}
        <span>Updated: {formatDate(feed.updatedAt)}</span>
      {/if}
    </div>

    <div class="flex items-center text-sm">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {feed.type}
      </span>
      {#if feed.public}
        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Public
        </span>
      {:else}
        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Private
        </span>
      {/if}
    </div>
  </div>

  <!-- Display feed content -->
  <div class="prose max-w-none">
    {#if isEditorJSContent(feed.content) && feed.content.blocks && feed.content.blocks.length > 0}
      {#each feed.content.blocks as block, blockIdx (block.id || blockIdx)}
        {#if block.type === 'header'}
          {#if block.data.level === 1}
            <h1 class="text-2xl font-bold mt-6 mb-4">{block.data.text}</h1>
          {:else if block.data.level === 2}
            <h2 class="text-xl font-bold mt-6 mb-4">{block.data.text}</h2>
          {:else if block.data.level === 3}
            <h3 class="text-lg font-bold mt-6 mb-4">{block.data.text}</h3>
          {:else if block.data.level === 4}
            <h4 class="text-base font-bold mt-6 mb-4">{block.data.text}</h4>
          {:else if block.data.level === 5}
            <h5 class="text-sm font-bold mt-6 mb-4">{block.data.text}</h5>
          {:else if block.data.level === 6}
            <h6 class="text-xs font-bold mt-6 mb-4">{block.data.text}</h6>
          {:else}
            <h2 class="text-xl font-bold mt-6 mb-4">{block.data.text}</h2>
          {/if}
        {:else if block.type === 'paragraph'}
          <p class="mb-4 text-gray-700">
            {block.data.text}
          </p>
        {:else if block.type === 'list'}
          {#if block.data.style === 'ordered'}
            <ol class="list-decimal list-inside mb-4">
              {#each block.data.items as item}
                <li class="mb-2 text-gray-700">{item}</li>
              {/each}
            </ol>
          {:else}
            <ul class="list-disc list-inside mb-4">
              {#each block.data.items as item}
                <li class="mb-2 text-gray-700">{item}</li>
              {/each}
            </ul>
          {/if}
        {:else if block.type === 'image'}
          <div class="my-6">
            <img
              src={block.data.file?.url || block.data.url}
              alt={block.data.caption || 'Image'}
              class="max-w-full h-auto rounded-lg shadow-md"
            />
            {#if block.data.caption}
              <p class="text-center text-sm text-gray-500 mt-2">{block.data.caption}</p>
            {/if}
          </div>
        {:else if block.type === 'code'}
        <div class="w-full p-6">
            <Code.Root lang={block.data.languageCode} code={block.data.code}>
             <Code.CopyButton />
            </Code.Root>
        </div>
        {:else if block.type === 'quote'}
          <blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-6">
            {block.data.text}
            {#if block.data.caption}
              <footer class="text-sm not-italic mt-2">— {block.data.caption}</footer>
            {/if}
          </blockquote>
        {:else if block.type === 'delimiter'}
          <div class="my-8 text-center">
            <div class="border-t border-gray-300"></div>
          </div>
        {:else if block.type === 'embed'}
          <div class="my-6">
            <div class="aspect-w-16 aspect-h-9">
              <iframe
                src={block.data.embed}
                class="w-full h-96 rounded-lg shadow-md"
                title="Embedded content"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        {:else}
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
            <p class="text-yellow-700">Unsupported block type: {block.type}</p>
          </div>
        {/if}
      {/each}
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-500">This feed has no content yet.</p>
      </div>
    {/if}
  </div>
</div>
