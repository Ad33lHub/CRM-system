import React from 'react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage CRM configuration parameters and global system rules"
      />
      
      {/* Outer Container */}
      <div 
        style={{
          border: '1px solid #1e293b',
          borderRadius: '16px',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a2332',
          padding: '60px 24px',
          textAlign: 'center'
        }}
      >
        {/* Gear Icon */}
        <Settings style={{ width: '64px', height: '64px', color: '#334155' }} />

        {/* Heading */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '16px', color: '#f8fafc' }}>
          System Configurations
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '340px', textAlign: 'center', margin: '8px auto 24px' }}>
          Configure SMTP mail server, automated backup jobs, notification channels, or currency definitions.
        </p>

        {/* CTA Button */}
        <button 
          type="button"
          onClick={() => toast.info('System configuration parameters are currently locked.')}
          className="btn-primary-cta"
        >
          Configure Settings
        </button>
      </div>
    </div>
  );
}
