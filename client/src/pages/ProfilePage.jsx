import React from 'react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { User, Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information, profile photo, and security password"
      />
      
      {/* Profile Card Container */}
      <div 
        className="bg-[#1a2332] text-foreground flex flex-col items-center"
        style={{
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid #1e293b'
        }}
      >
        {/* Avatar Circle */}
        <div 
          className="flex items-center justify-center overflow-hidden bg-[#1e293b]"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '2px solid #334155'
          }}
        >
          {user?.avatarUrl || user?.avatar ? (
            <img 
              src={user.avatarUrl || user.avatar} 
              alt={user.name} 
              className="w-full h-full object-cover"
            />
          ) : user?.name ? (
            <span className="text-[#f8fafc] text-2xl font-extrabold uppercase">
              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </span>
          ) : (
            <User style={{ width: '40px', height: '40px', color: '#475569' }} />
          )}
        </div>

        {/* Hello, User text */}
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginTop: '16px', color: '#f8fafc' }}>
          Hello, {user?.name || 'User'}
        </h2>

        {/* Email line */}
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          {user?.email || 'user@example.com'}
        </p>

        {/* Form fields */}
        <div className="w-full mt-8">
          {/* Name Field */}
          <div style={{ marginBottom: '20px' }}>
            <label 
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}
            >
              Name
            </label>
            <input 
              type="text"
              defaultValue={user?.name || ''}
              readOnly
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #334155',
                padding: '10px 14px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                outline: 'none'
              }}
            />
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <label 
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}
            >
              Email Address
            </label>
            <input 
              type="email"
              defaultValue={user?.email || ''}
              readOnly
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #334155',
                padding: '10px 14px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                outline: 'none'
              }}
            />
          </div>

          {/* Change Password Section */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px', marginTop: '30px' }}>
            <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
              <Lock className="h-4 w-4 text-[#3b82f6]" />
              Change Password
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px'
                }}
              >
                New Password
              </label>
              <input 
                type="password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  padding: '10px 14px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px'
                }}
              >
                Confirm New Password
              </label>
              <input 
                type="password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  padding: '10px 14px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button type="button" className="btn-primary-cta">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

