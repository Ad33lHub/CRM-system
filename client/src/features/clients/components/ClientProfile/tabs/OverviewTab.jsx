import React, { useState } from 'react';
import { Mail, Phone, Tag, Plus, Award, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetEmployeesQuery } from '@/services/employeesApi';
import {
  useUpdateClientMutation,
  useAddContactMutation,
  useRemoveContactMutation,
  useSetPrimaryContactMutation,
} from '@/services/clientsApi';
import { toast } from 'sonner';

export default function OverviewTab({ client }) {
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const [updateClient, { isLoading: isUpdatingClient }] = useUpdateClientMutation();
  const [addContact, { isLoading: isAddingContact }] = useAddContactMutation();
  const [removeContact] = useRemoveContactMutation();
  const [setPrimaryContact] = useSetPrimaryContactMutation();

  // Local State
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    isPrimary: false,
    notes: '',
  });

  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Handlers
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      email: '',
      phone: '',
      designation: '',
      department: '',
      isPrimary: false,
      notes: '',
    });
    setIsContactDialogOpen(true);
  };

  const handleOpenEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      designation: contact.designation || '',
      department: contact.department || '',
      isPrimary: contact.isPrimary || false,
      notes: contact.notes || '',
    });
    setIsContactDialogOpen(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      toast.error('Contact name is required');
      return;
    }

    try {
      if (editingContact) {
        // Edit contact uses updateClient by updating the contacts array
        const updatedContacts = client.contacts.map((c) =>
          (c._id || c.id) === (editingContact._id || editingContact.id)
            ? { ...c, ...contactForm, _id: editingContact._id || editingContact.id }
            : c
        );
        await updateClient({ id: client._id || client.id, contacts: updatedContacts }).unwrap();
        toast.success('Contact updated successfully');
      } else {
        // Add new contact
        await addContact({ clientId: client._id || client.id, contact: contactForm }).unwrap();
        toast.success('Contact added successfully');
      }
      setIsContactDialogOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save contact');
    }
  };

  const handleRemoveContact = async (contactId) => {
    if (confirm('Are you sure you want to remove this contact?')) {
      try {
        await removeContact({ clientId: client._id || client.id, contactId }).unwrap();
        toast.success('Contact removed');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to remove contact');
      }
    }
  };

  const handleSetPrimary = async (contactId) => {
    try {
      await setPrimaryContact({ clientId: client._id || client.id, contactId }).unwrap();
      toast.success('Primary contact updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update primary contact');
    }
  };

  const handleAssignChange = async (userId) => {
    try {
      await updateClient({
        id: client._id || client.id,
        assignedTo: userId === 'unassigned' ? null : userId,
      }).unwrap();
      toast.success('Assigned representative updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update assignee');
    }
  };

  const handleFollowUpChange = async (date) => {
    try {
      await updateClient({
        id: client._id || client.id,
        nextFollowUpAt: date || null,
      }).unwrap();
      toast.success('Follow-up date updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update follow-up date');
    }
  };

  const handleAddTagSubmit = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (client.tags?.includes(tag)) {
      toast.error('Tag already exists');
      return;
    }
    try {
      const updatedTags = [...(client.tags || []), tag];
      await updateClient({ id: client._id || client.id, tags: updatedTags }).unwrap();
      setNewTag('');
      setIsAddingTag(false);
      toast.success('Tag added');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      const updatedTags = client.tags?.filter((t) => t !== tagToRemove) || [];
      await updateClient({ id: client._id || client.id, tags: updatedTags }).unwrap();
      toast.success('Tag removed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove tag');
    }
  };

  const employeesList = employeesData?.data || employeesData || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SECTION 1 — Contacts Grid */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold">Contacts</CardTitle>
            <Button size="sm" onClick={handleOpenAddContact} className="h-8 gap-1">
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          </CardHeader>
          <CardContent>
            {client.contacts?.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No contacts added yet. Click Add Contact to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.contacts?.map((contact) => (
                  <Card key={contact._id || contact.id} className="relative overflow-hidden group">
                    <CardContent className="p-4 space-y-3">
                      {contact.isPrimary && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 gap-1 text-[10px] py-0">
                            <Award className="h-3 w-3" /> Primary
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {contact.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm leading-none">{contact.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {contact.designation || 'No title'} {contact.department ? `· ${contact.department}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>

                      {contact.notes && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2 bg-muted/30 p-2 rounded">
                          &ldquo;{contact.notes}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t pt-3 mt-1">
                        {!contact.isPrimary ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => handleSetPrimary(contact._id || contact.id)}
                          >
                            Set Primary
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">Primary Contact</span>
                        )}

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleOpenEditContact(contact)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                            onClick={() => handleRemoveContact(contact._id || contact.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3 — Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {client.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground hover:text-foreground rounded-full text-xs"
                  >
                    ×
                  </button>
                </Badge>
              ))}

              {isAddingTag ? (
                <form onSubmit={handleAddTagSubmit} className="flex items-center gap-2">
                  <Input
                    placeholder="New tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="h-7 w-28 text-xs px-2"
                    // Focus the inline tag input immediately when it opens.
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  />
                  <Button type="submit" size="icon" className="h-7 w-7">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setIsAddingTag(false);
                      setNewTag('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </form>
              ) : (
                <Button
                  onClick={() => setIsAddingTag(true)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-dashed gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Tag
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2 — Company Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Website</span>
                <span className="font-medium text-foreground truncate block">
                  {client.website ? (
                    <a
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {client.website}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Industry</span>
                <span className="font-medium text-foreground capitalize block">{client.industry}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Company Size</span>
                <span className="font-medium text-foreground block">{client.companySize || 'Not specified'}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Source</span>
                <span className="font-medium text-foreground capitalize block">{client.source}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Currency</span>
                <span className="font-medium text-foreground block">{client.currency || 'PKR'}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Created Date</span>
                <span className="font-medium text-foreground block">
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              {/* Assigned To Select */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold">Assigned Account Representative</Label>
                <Select
                  value={client.assignedTo?._id || client.assignedTo || 'unassigned'}
                  onValueChange={handleAssignChange}
                  disabled={isUpdatingClient}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employeesList.map((emp) => {
                      const u = emp.user || emp;
                      if (!u) return null;
                      return (
                        <SelectItem key={u._id || u.id} value={u._id || u.id}>
                          {u.firstName} {u.lastName} ({u.role})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Next Follow-Up Date Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold" htmlFor="nextFollowUp">Next Follow-Up</Label>
                <Input
                  id="nextFollowUp"
                  type="date"
                  value={client.nextFollowUpAt ? new Date(client.nextFollowUpAt).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFollowUpChange(e.target.value)}
                  disabled={isUpdatingClient}
                  className="h-9"
                />
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Last Contacted</span>
                <span className="font-medium text-foreground block text-sm">
                  {client.lastContactedAt ? new Date(client.lastContactedAt).toLocaleString() : 'Not contacted yet'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              Provide name and communication details for the client representative.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveContact} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="contactName">Name <span className="text-destructive">*</span></Label>
              <Input
                id="contactName"
                placeholder="Ahmed Khan"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="ahmed@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  placeholder="+92 300 1234567"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="contactDesignation">Designation</Label>
                <Input
                  id="contactDesignation"
                  placeholder="Project Manager"
                  value={contactForm.designation}
                  onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="contactDept">Department</Label>
                <Input
                  id="contactDept"
                  placeholder="Engineering"
                  value={contactForm.department}
                  onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactNotes">Internal Notes</Label>
              <Input
                id="contactNotes"
                placeholder="Key technical stakeholder..."
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                maxLength={500}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContactDialogOpen(false)}
                disabled={isAddingContact || isUpdatingClient}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingContact || isUpdatingClient}>
                {(isAddingContact || isUpdatingClient) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingContact ? 'Save Changes' : 'Add Contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
