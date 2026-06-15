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

  const getTabStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      padding: '10px 16px',
      borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
      color: isActive ? '#f8fafc' : '#64748b',
      backgroundColor: 'transparent',
      fontWeight: 500,
      fontSize: '14px',
      transition: 'all 0.2s',
      cursor: 'pointer'
    };
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
      <TabsList 
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid #1e293b',
          marginBottom: '24px',
          backgroundColor: 'transparent',
          height: 'auto',
          padding: 0,
          borderRadius: 0
        }}
        className="w-full overflow-x-auto flex-nowrap justify-start"
      >
        <TabsTrigger
          value="overview"
          style={getTabStyle('overview')}
          className="rounded-none shadow-none focus-visible:ring-0 focus-visible:outline-none"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="projects"
          style={getTabStyle('projects')}
          className="rounded-none shadow-none focus-visible:ring-0 focus-visible:outline-none"
        >
          Projects
        </TabsTrigger>
        <TabsTrigger
          value="invoices"
          style={getTabStyle('invoices')}
          className="rounded-none shadow-none focus-visible:ring-0 focus-visible:outline-none"
        >
          Invoices
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          style={getTabStyle('notes')}
          className="rounded-none shadow-none focus-visible:ring-0 focus-visible:outline-none"
        >
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="status_history"
          style={getTabStyle('status_history')}
          className="rounded-none shadow-none focus-visible:ring-0 focus-visible:outline-none"
        >
          Status History
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          style={getTabStyle('documents')}
          className="rounded-none shadow-none focus-visible:ring-0 focus-visible:outline-none"
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

