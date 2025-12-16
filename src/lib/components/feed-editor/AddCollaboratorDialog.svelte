<script lang="ts">
  import type { Id, Doc } from "$convex/_generated/dataModel";

  import { useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import { toast } from 'svelte-sonner';

  // Shadcn-svelte components
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Select from "$lib/components/ui/select/index.js";

  let { isOpen, feed, onClose } = $props();

  // Dialog state for adding collaborators
  let searchEmail = $state('');
  let searchResults = $state<any[]>([]);
  let selectedRole = $state<'read' | 'edit' | 'admin'>('read');
  let isSearching = $state(false);
  let isAdding = $state(false);

  // Debounce timer for search
  let searchTimeout: NodeJS.Timeout | null = $state(null);

  // Search for users to add as collaborators
  async function searchUsers() {
    if (!feed || !feed._id || searchEmail.length < 2) {
      searchResults = [];
      return;
    }

    isSearching = true;
    try {
      const convexClient = useConvexClient();
      const results = await convexClient.query(
        api.feeds.feedCollaborators.searchUsersForCollaboration,
        {
          feedId: feed._id,
          emailQuery: searchEmail
        }
      );
      searchResults = results;
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      searchResults = [];
    } finally {
      isSearching = false;
    }
  }

  // Handle adding a collaborator
  async function handleAddCollaborator(selectedUserId: string) {
    if (!feed || !feed._id) return;

    const convexClient = useConvexClient();
    isAdding = true;
    try {
      await convexClient.mutation(
        api.feeds.feedCollaborators.addCollaborator,
        {
          feedId: feed._id,
          userId: selectedUserId,
          role: selectedRole
        }
      );

      toast.success('Collaborator added successfully');
      onClose();
      searchResults = [];
      selectedRole = 'read';
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add collaborator');
    } finally {
      isAdding = false;
    }
  }
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Add Collaborator</Dialog.Title>
      <Dialog.Description>
        Search for a user by email to add them as a collaborator to this feed.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="email-search">User Email</Label>
        <div class="flex gap-2">
          <Input
            id="email-search"
            type="email"
            bind:value={searchEmail}
            placeholder="user@example.com"
            oninput={() => {
              // Debounce the search to avoid too many API calls
              if(searchTimeout) clearTimeout(searchTimeout);
              searchTimeout = setTimeout(() => {
                searchUsers();
              }, 300);
            }}
          />
          {#if isSearching}
            <div class="flex items-center">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          {/if}
        </div>
      </div>

      {#if searchResults.length > 0}
        <div class="border rounded-md">
          <div class="p-2 border-b text-sm font-medium">Search Results</div>
          {#each searchResults as user (user.id)}
            <div class="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                 role="button"
                 tabindex="0"
                 onclick={() => handleAddCollaborator(user.id)}
                 onkeydown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     handleAddCollaborator(user.id);
                   }
                 }}>
              <div>
                <div class="font-medium">{user.name}</div>
                <div class="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onclick={(e: any) => {
                  e.stopPropagation();
                  handleAddCollaborator(user.id);
                }}
              >
                Add
              </Button>
            </div>
          {/each}
        </div>
      {/if}

      <div class="grid gap-2">
        <Label for="role-select">Role</Label>
        <Select.Root type="single" bind:value={selectedRole}>
          <Select.Trigger>
            {selectedRole === 'read' ? 'Read' : selectedRole === 'edit' ? 'Edit' : 'Admin'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="read" label="Read access">
              Read - Can view the feed
            </Select.Item>
            <Select.Item value="edit" label="Edit access">
              Edit - Can view and edit the feed
            </Select.Item>
            <Select.Item value="admin" label="Admin access">
              Admin - Can manage collaborators and settings
            </Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => {
          onClose();
          searchEmail = '';
          searchResults = [];
        }}
      >
        Cancel
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
