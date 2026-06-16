import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileHeader from '@/features/clients/components/ClientProfile/ProfileHeader';
import ProfileTabs from '@/features/clients/components/ClientProfile/ProfileTabs';
import StatusChangeDialog from '@/features/clients/components/StatusChangeDialog';
import EditClientSheet from '@/features/clients/components/EditClientSheet';
import DeleteClientDialog from '@/features/clients/components/DeleteClientDialog';
import {
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useInviteClientPortalMutation,
} from '@/services/clientsApi';
import useAuth from '@/hooks/useAuth';
import { toast } from 'sonner';

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ClientProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useAuth();

  const { data, isLoading, error } = useGetClientByIdQuery(id);
  const [updateClient] = useUpdateClientMutation();
  const [invitePortal, { isLoading: isInviting }] = useInviteClientPortalMutation();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const client = data?.data;
  const canDelete = ['super_admin', 'admin'].includes(role);

  const handleInvitePortal = async () => {
    try {
      const res = await invitePortal({ id }).unwrap();
      toast.success(`Portal invite sent to ${res?.data?.email || 'the client'}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send portal invite');
    }
  };

  // Redirect on access/not-found errors
  useEffect(() => {
    if (!error) return;
    const status = error.status;
    if (status === 404) navigate('/404', { replace: true });
    else if (status === 403) navigate('/403', { replace: true });
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Client Profile"
          breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'Loading…' }]}
        />
        <ProfileSkeleton />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Client Profile"
          breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'Not found' }]}
        />
        <p className="text-sm text-muted-foreground">Client could not be loaded.</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  const handleRemoveTag = async (tag) => {
    try {
      const tags = (client.tags || []).filter((t) => t !== tag);
      await updateClient({ id: client._id, tags }).unwrap();
      toast.success('Tag removed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove tag');
    }
  };

  const handleAddTag = async () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag) {
      setAddingTag(false);
      return;
    }
    if ((client.tags || []).includes(tag)) {
      toast.error('Tag already exists');
      return;
    }
    try {
      await updateClient({ id: client._id, tags: [...(client.tags || []), tag] }).unwrap();
      setNewTag('');
      setAddingTag(false);
      toast.success('Tag added');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add tag');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.companyName}
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: client.companyName },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {canDelete && (
              <Button variant="outline" size="sm" disabled={isInviting} onClick={handleInvitePortal}>
                {isInviting ? 'Inviting…' : 'Invite to Portal'}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Archive
              </Button>
            )}
          </div>
        }
      />

      <ProfileHeader
        client={client}
        userRole={role}
        onEdit={() => setEditOpen(true)}
        onStatusChange={() => setStatusDialogOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onRemoveTag={handleRemoveTag}
        onAddTag={() => setAddingTag(true)}
      />

      {addingTag && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddTag();
          }}
          className="flex items-center gap-2"
        >
          <Input
            // Focus the inline tag field the moment it appears.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            placeholder="New tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="h-8 w-40 text-xs"
          />
          <Button type="submit" size="sm">
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setAddingTag(false);
              setNewTag('');
            }}
          >
            Cancel
          </Button>
        </form>
      )}

      <ProfileTabs clientId={client._id} client={client} />

      <StatusChangeDialog
        client={client}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />

      <EditClientSheet client={client} open={editOpen} onOpenChange={setEditOpen} />

      <DeleteClientDialog
        client={client}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => navigate('/clients')}
      />
    </div>
  );
}
