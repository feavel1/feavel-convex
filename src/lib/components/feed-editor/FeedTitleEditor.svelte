<script lang="ts">
  let { feed, debouncedSave } = $props();
</script>

<div class="mb-6">
  <input
    type="text"
    value={feed?.title ?? ''}
    oninput={(e) => {
      const newTitle = (e.target as HTMLInputElement).value;
      if (feed) {
        feed.title = newTitle;
        debouncedSave();
      }
    }}
    class="w-full text-2xl font-bold border-b border-gray-300 focus:outline-none focus:border-blue-500 p-2"
    placeholder="Feed title"
  />
</div>
