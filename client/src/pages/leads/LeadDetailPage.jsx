import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px'
  };

  const inputStyle = {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #334155',
    padding: '10px 14px',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '14px'
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <div 
        style={{
          fontSize: '13px',
          color: '#64748b',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span className="cursor-pointer hover:underline" onClick={() => navigate('/leads')}>Leads</span>
        <span style={{ color: '#334155' }}>›</span>
        <span className="text-[#f8fafc]">Lead Detail</span>
      </div>

      {/* Main Layout Row */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left main pane (Lead Form) */}
        <div className="flex-1 w-full bg-[#1a2332] p-[32px] border border-[#1e293b] rounded-[12px]">
          {/* Page Hero Section */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#f8fafc' }}>
              Create New Lead
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
              Create and manage details for lead opportunity: {id}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              
              {/* Lead Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Lead Name</label>
                <input type="text" placeholder="e.g. TechCorp E2E Platform" style={inputStyle} />
              </div>

              {/* Company */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Company</label>
                <input type="text" placeholder="e.g. TechCorp" style={inputStyle} />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" placeholder="e.g. sales@techcorp.com" style={inputStyle} />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Phone</label>
                <input type="text" placeholder="e.g. +92 300 1234567" style={inputStyle} />
              </div>

              {/* Lead Source */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Lead Source</label>
                <select style={inputStyle}>
                  <option value="website">Website</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                </select>
              </div>

              {/* Assigned To */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Assigned To</label>
                <select style={inputStyle}>
                  <option value="unassigned">Select Rep...</option>
                  <option value="rep1">Sales Rep 1</option>
                  <option value="rep2">Sales Rep 2</option>
                </select>
              </div>

              {/* Expected Value */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Expected Value</label>
                <input type="text" placeholder="e.g. 150000" style={inputStyle} />
              </div>

              {/* Stage/Status */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Stage / Status</label>
                <select style={inputStyle}>
                  <option value="new">New Opportunity</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea 
                placeholder="Write description or customer background..." 
                style={{
                  ...inputStyle,
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button"
                onClick={() => navigate('/leads')}
                style={{
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: 'transparent',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
                className="hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  toast.success('Lead created successfully!');
                  navigate('/leads');
                }}
                className="btn-primary-cta"
              >
                Create Lead
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar Panel */}
        <div 
          style={{
            width: '280px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '20px',
            backgroundColor: '#1a2332',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
          className="shrink-0"
        >
          <h3 className="text-sm font-bold text-slate-200 mb-6 self-start">Leads & Pipeline</h3>
          
          {/* Pipeline is Empty state */}
          <div className="flex flex-col items-center py-6">
            <TrendingUp style={{ width: '40px', height: '40px', color: '#334155' }} />
            <p style={{ fontSize: '14px', color: '#64748b', margin: '12px 0' }}>
              Pipeline is Empty
            </p>
          </div>

          <button 
            type="button"
            onClick={() => toast.info('You are currently creating a new lead')}
            className="btn-primary-cta w-full"
            style={{ borderRadius: '8px' }}
          >
            Create New Lead
          </button>
        </div>

      </div>
    </div>
  );
}

