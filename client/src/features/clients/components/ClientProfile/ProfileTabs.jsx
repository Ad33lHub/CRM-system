import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './tabs/OverviewTab';
import ProjectsTab from './tabs/ProjectsTab';
import InvoicesTab from './tabs/InvoicesTab';
import NotesTab from './tabs/NotesTab';
import StatusHistoryTab from './tabs/StatusHistoryTab';
import DocumentsTab from './tabs/DocumentsTab';

export default function ProfileTabs({ clientId, client, onUpdateClient }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loadedTabs, setLoadedTabs] = useState(['overview']);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (!loadedTabs.includes(tab)) {
      setLoadedTabs((prev) => [...prev, tab]);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
      <TabsList className="grid grid-cols-6 w-full md:w-auto md:inline-flex border-b h-11 bg-background p-0 rounded-none gap-6">
        <TabsTrigger
          value="overview"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-semibold text-sm h-11"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="projects"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-semibold text-sm h-11"
        >
          Projects
        </TabsTrigger>
        <TabsTrigger
          value="invoices"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-semibold text-sm h-11"
        >
          Invoices
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-semibold text-sm h-11"
        >
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="status_history"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-semibold text-sm h-11"
        >
          Status History
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-semibold text-sm h-11"
        >
          Documents
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
        <OverviewTab client={client} onUpdateClient={onUpdateClient} />
      </TabsContent>

      {loadedTabs.includes('projects') && (
        <TabsContent value="projects" className="mt-0 focus-visible:outline-none">
          <ProjectsTab clientId={clientId} />
        </TabsContent>
      )}

      {loadedTabs.includes('invoices') && (
        <TabsContent value="invoices" className="mt-0 focus-visible:outline-none">
          <InvoicesTab clientId={clientId} />
        </TabsContent>
      )}

      {loadedTabs.includes('notes') && (
        <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
          <NotesTab clientId={clientId} />
        </TabsContent>
      )}

      {loadedTabs.includes('status_history') && (
        <TabsContent value="status_history" className="mt-0 focus-visible:outline-none">
          <StatusHistoryTab clientId={clientId} client={client} />
        </TabsContent>
      )}

      {loadedTabs.includes('documents') && (
        <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
          <DocumentsTab clientId={clientId} />
        </TabsContent>
      )}
    </Tabs>
  );
}

