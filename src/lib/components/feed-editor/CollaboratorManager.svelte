<script lang="ts">
  import type { Id, Doc } from "$convex/_generated/dataModel";

  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';
  import { toast } from 'svelte-sonner';

  // Shadcn-svelte components
  import * as Table from '$lib/components/ui/table/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Select from "$lib/components/ui/select/index.js";
  import { UserPlus, Trash2 } from '@lucide/svelte';

  // Define the type for feed collaborators including user details
  interface FeedCollaborator {
    _id: Id<"feedCollaborators">;
    feedId: Id<"feed">;
    userId: string;
    role: 'read' | 'edit' | 'admin';
    addedAt: number;
    user?: {
      name: string;
      email: string;
    } | null;
  }

  let { feed, currentUser, showAddCollaboratorDialog, setShowAddCollaboratorDialog } = $props();

  // State for collaborators
  let collaboratorsQuery = useQuery(api.feeds.feedCollaborators.getFeedCollaborators, () => ({ feedId: feed._id }));
  let collaborators = $derived(collaboratorsQuery.data as FeedCollaborator[] || []);
  let isLoading = $derived(collaboratorsQuery.isLoading);
  let error = $derived(collaboratorsQuery.error);

  let isOwner = $derived(!!feed && !!currentUser && feed.createdBy === currentUser._id);

  // Alert dialog state for removing collaborators
  let showRemoveDialog = $state(false);
  let userToRemove = $state<{ id: string; name: string } | null>(null);

  // Confirm remove collaborator
  function confirmRemoveCollaborator(collaborator: FeedCollaborator) {
    // Don't allow removing the feed owner
    if (feed && collaborator.userId === feed.createdBy) {
      toast.error('Cannot remove the feed owner');
      return;
    }

    userToRemove = {
      id: collaborator._id,
      name: collaborator.user?.name || collaborator.userId
    };
    showRemoveDialog = true;
  }

  // Handle removing a collaborator
  async function handleRemoveCollaborator() {
    if (!userToRemove || !feed || !feed._id) return;

    const convexClient = useConvexClient();

    try {
      await convexClient.mutation(
        api.feeds.feedCollaborators.removeCollaborator,
        {
          feedId: feed._id,
          userId: userToRemove.id // Pass the userId directly
        }
      );

      toast.success('Collaborator removed successfully');
      showRemoveDialog = false;
      userToRemove = null;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove collaborator');
    }
  }

  // Handle updating collaborator role
  async function handleUpdateRole(collaboratorId: string, newRole: 'read' | 'edit' | 'admin') {
    if (!feed || !feed._id) return;

    const convexClient = useConvexClient();

    try {
      await convexClient.mutation(
        api.feeds.feedCollaborators.updateCollaboratorRole,
        {
          feedId: feed._id,
          userId: collaboratorId, // Pass the userId directly
          role: newRole
        }
      );

      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  }
</script>

<div class="mt-6 pt-6 border-t">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold">Collaborators</h3>
      <p class="text-sm text-muted-foreground">Manage users who can access this feed</p>
    </div>
    {#if isOwner}
      <Button
        variant="outline"
        onclick={() => setShowAddCollaboratorDialog(true)}
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Add Collaborator
      </Button>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="text-red-500 text-sm">Error loading collaborators: {error.message}</div>
  {:else if collaborators}
    {#if collaborators.length === 0}
      <div class="text-center py-8 text-muted-foreground">
        No collaborators added yet.
        {#if isOwner}
          <p class="mt-2">Add a collaborator to share access to this feed.</p>
        {/if}
      </div>
    {:else}
      <div class="rounded-md border">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
              <Table.Head>Added</Table.Head>
              {#if isOwner}
                <Table.Head class="text-right">Actions</Table.Head>
              {/if}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each collaborators as collaborator (collaborator._id)}
              <Table.Row>
                <Table.Cell class="font-medium">
                  {collaborator.user?.name || 'Unknown User'}
                </Table.Cell>
                <Table.Cell>
                  {collaborator.user?.email || collaborator.userId}
                </Table.Cell>
                <Table.Cell>
                  {#if isOwner && collaborator.userId !== feed.createdBy}
                    <Select.Root
                      type="single"
                      value={collaborator.role}
                      onValueChange={(value) => {
                        if (value && (value === 'read' || value === 'edit' || value === 'admin')) {
                          handleUpdateRole(collaborator._id, value as 'read' | 'edit' | 'admin');
                        }
                      }}
                    >
                      <Select.Trigger class="w-24">
                        {collaborator.role}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="read" label="Read">Read</Select.Item>
                        <Select.Item value="edit" label="Edit">Edit</Select.Item>
                        <Select.Item value="admin" label="Admin">Admin</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  {:else}
                    <Badge variant={collaborator.role === 'admin' ? 'default' :
                                  collaborator.role === 'edit' ? 'secondary' : 'outline'}>
                      {collaborator.role}
                    </Badge>
                  {/if}
                </Table.Cell>
                <Table.Cell>
                  {new Date(collaborator.addedAt).toLocaleDateString()}
                </Table.Cell>
                {#if isOwner && collaborator.userId !== feed.createdBy}
                  <Table.Cell class="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => confirmRemoveCollaborator(collaborator)}
                    >
                      <Trash2 class="w-4 h-4 text-destructive" />
                    </Button>
                  </Table.Cell>
                {/if}
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  {/if}
</div>

