<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

  interface RemoveCollaboratorDialogProps {
    isOpen: boolean;
    userToRemove: { id: string; name: string } | null;
    onRemove: () => void;
    onCancel: () => void;
  }

  let {
    isOpen: isOpenProp,
    userToRemove: userToRemoveProp,
    onRemove: onRemoveProp,
    onCancel: onCancelProp
  } = $props();
</script>

<AlertDialog.Root bind:open={isOpenProp}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Remove Collaborator?</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to remove <strong>{userToRemoveProp?.name}</strong> from this feed?
        They will lose access to this feed.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={onCancelProp}>
        Cancel
      </AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={onRemoveProp}
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Remove
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>