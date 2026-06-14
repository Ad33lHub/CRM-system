import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  StickyNote,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth';
import { useGetEmployeesQuery } from '@/services/employeesApi';
import {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useTogglePinMutation,
} from '@/services/clientsApi';

const MAX_NOTE_LENGTH = 5000;
const MANAGER_ROLES = ['super_admin', 'admin', 'manager'];

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

function NoteCard({ note, clientId, currentUserId, isManager, mentionSuggestions }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();
  const [togglePin, { isLoading: isPinning }] = useTogglePinMutation();

  const author = note.author || {};
  const isOwner = (author._id || author.id) === currentUserId;
  const canModify = isOwner || isManager;

  const handleSaveEdit = async () => {
    try {
      await updateNote({ clientId, noteId: note._id || note.id, content: editContent }).unwrap();
      toast.success('Note updated');
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update note');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote({ clientId, noteId: note._id || note.id }).unwrap();
      toast.success('Note deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete note');
    }
  };

  const handlePin = async () => {
    try {
      await togglePin({ clientId, noteId: note._id || note.id }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to pin note');
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(note.contentText || '');
    toast.success('Note copied to clipboard');
  };

  return (
    <Card className={cn(note.isPinned && 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/10')}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {author.avatar && <AvatarImage src={author.avatar} alt={author.firstName} />}
              <AvatarFallback className="bg-primary/5 text-xs text-primary">
                {author.firstName?.[0]}
                {author.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-none">
                {author.firstName} {author.lastName}
                {author.role && (
                  <span className="ml-1.5 text-xs font-normal capitalize text-muted-foreground">
                    · {author.role.replace(/_/g, ' ')}
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {timeAgo(note.createdAt)}
                {note.isEdited && (
                  <span className="ml-1 italic">· edited {timeAgo(note.editedAt)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {isManager && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handlePin}
                      disabled={isPinning}
                    >
                      <Pin
                        className={cn(
                          'h-4 w-4',
                          note.isPinned
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{note.isPinned ? 'Unpin note' : 'Pin note'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {canModify && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2">
                    <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopy} className="gap-2">
                  <Copy className="h-4 w-4 text-muted-foreground" /> Copy
                </DropdownMenuItem>
                {canModify && (
                  <DropdownMenuItem
                    onClick={() => setConfirmOpen(true)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <hr className="border-border" />

        {isEditing ? (
          <div className="space-y-2">
            <RichTextEditor
              content={editContent}
              onChange={setEditContent}
              maxLength={MAX_NOTE_LENGTH}
              mentionSuggestions={mentionSuggestions}
              // Focus the editor immediately when entering inline edit mode.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(note.content);
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <RichTextEditor content={note.content} readonly />
        )}

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete this note?"
          description="This note will be removed. This action cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}

export default function NotesTab({ clientId }) {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const isManager = MANAGER_ROLES.includes(user?.role);

  const [isComposing, setIsComposing] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce search (300ms)
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const mentionSuggestions = useMemo(() => {
    const list = employeesData?.data || employeesData || [];
    return list
      .map((emp) => {
        const u = emp.user || emp;
        if (!u?._id && !u?.id) return null;
        return {
          id: u._id || u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          role: u.role,
          avatar: u.avatar,
        };
      })
      .filter(Boolean);
  }, [employeesData]);

  const { data, isLoading, isFetching } = useGetNotesQuery({
    clientId,
    page: 1,
    limit: 20,
    search: search || undefined,
  });

  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();

  const notes = data?.data || [];
  const total = data?.pagination?.totalItems ?? notes.length;
  const pinned = notes.filter((n) => n.isPinned);
  const unpinned = notes.filter((n) => !n.isPinned);

  const handleCreate = async () => {
    if (!newContent || newContent === '<p></p>') {
      toast.error('Note cannot be empty');
      return;
    }
    try {
      await createNote({ clientId, content: newContent }).unwrap();
      toast.success('Note added');
      setNewContent('');
      setIsComposing(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add note');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        {!isComposing && (
          <Button onClick={() => setIsComposing(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Note
          </Button>
        )}
      </div>

      {/* Composer */}
      {isComposing && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <RichTextEditor
              content={newContent}
              onChange={setNewContent}
              placeholder="Write a note... use @ to mention a team member"
              maxLength={MAX_NOTE_LENGTH}
              mentionSuggestions={mentionSuggestions}
              // Focus the composer as soon as it opens for a fast note-taking flow.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsComposing(false);
                  setNewContent('');
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <StickyNote className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No notes yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {search
              ? 'No notes match your search.'
              : 'Add the first note for this client.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Pin className="h-4 w-4 fill-amber-500 text-amber-500" />
                Pinned
                <Badge variant="secondary" className="ml-1">
                  {pinned.length}
                </Badge>
              </div>
              {pinned.map((note) => (
                <NoteCard
                  key={note._id || note.id}
                  note={note}
                  clientId={clientId}
                  currentUserId={currentUserId}
                  isManager={isManager}
                  mentionSuggestions={mentionSuggestions}
                />
              ))}
            </div>
          )}

          {/* All */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              All Notes
              <Badge variant="secondary" className="ml-1">
                {total}
              </Badge>
              {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </div>
            {unpinned.map((note) => (
              <NoteCard
                key={note._id || note.id}
                note={note}
                clientId={clientId}
                currentUserId={currentUserId}
                isManager={isManager}
                mentionSuggestions={mentionSuggestions}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
