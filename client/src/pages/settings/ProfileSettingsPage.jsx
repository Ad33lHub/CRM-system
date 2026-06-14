import React from 'react';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import AvatarUpload from '../../components/AvatarUpload.jsx';
import useAuth from '../../hooks/useAuth.js';
import { User, Shield, Calendar, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const { user } = useAuth();

  const handleAvatarSuccess = (_newUrl) => {
    toast.success('Profile picture updated successfully!');
    // Reload to refresh the avatar in layouts
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal credentials, contact info, and profile avatar"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Avatar Upload Card */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardContent className="pt-8 flex flex-col items-center justify-center space-y-4">
            <AvatarUpload
              userId={user._id || user.id}
              currentAvatar={user.avatar}
              size="150px"
              onSuccess={handleAvatarSuccess}
            />
            <div className="text-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-xs text-slate-400 capitalize font-medium">{user.role?.replace('_', ' ')}</p>
            </div>
            <p className="text-[11px] text-slate-400 text-center max-w-[200px]">
              Upload a JPG, PNG, or WebP image. Maximum file size is 5MB. Circular cropping will be applied.
            </p>
          </CardContent>
        </Card>

        {/* Credentials detail Card */}
        <Card className="md:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <span>Personal Identification Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Full Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{user.firstName} {user.lastName}</span>
              </div>

              {/* Email Address */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>Email Address</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{user.email}</span>
              </div>

              {/* Role Scope */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Security Role</span>
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">{user.role?.replace('_', ' ')}</span>
              </div>

              {/* Member Since */}
              {user.createdAt && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Member Since</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
