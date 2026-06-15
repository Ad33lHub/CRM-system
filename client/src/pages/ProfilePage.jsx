import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { User, Lock, Loader2, Save } from 'lucide-react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import useAuth from '../hooks/useAuth.js';
import { setCredentials } from '../features/auth/authSlice.js';
import { useUpdateProfileMutation, useChangePasswordMutation } from '../services/authApi.js';

const fieldLabel = 'text-xs font-semibold text-slate-400 uppercase tracking-wider';
// Mirrors the server's password strength rule.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

// Surface the server's specific validation message instead of a generic "failed".
const apiError = (err, fallback) => {
  const fields = err?.data?.error?.fields;
  if (fields) {
    const first = Object.values(fields)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return err?.data?.message || fallback;
};

export default function ProfilePage() {
  const { user, accessToken } = useAuth();
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [updateProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    try {
      const res = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      }).unwrap();
      const updatedUser = res?.data || res;
      // Refresh the cached user so the navbar/avatar reflect the new name.
      dispatch(setCredentials({ user: updatedUser, accessToken }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(apiError(err, 'Failed to update profile'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Enter your current and new password');
      return;
    }
    if (newPassword.length < 8 || !STRONG_PASSWORD.test(newPassword)) {
      toast.error(
        'New password needs 8+ characters with an uppercase, lowercase, number, and special character (@$!%*?&)'
      );
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from your current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword }).unwrap();
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(apiError(err, 'Failed to change password'));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and account password"
      />

      {/* ── Personal information ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-blue-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold uppercase text-slate-500">
                  {initials || <User className="h-7 w-7" />}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {firstName} {lastName}
              </p>
              <p className="text-xs capitalize text-slate-400">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="pf-first" className={fieldLabel}>
                  First Name
                </label>
                <Input
                  id="pf-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pf-last" className={fieldLabel}>
                  Last Name
                </label>
                <Input
                  id="pf-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pf-email" className={fieldLabel}>
                Email Address
              </label>
              <Input id="pf-email" value={user?.email || ''} readOnly disabled />
              <p className="text-[11px] text-slate-500">
                Email is your login ID and can&apos;t be changed here.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pf-phone" className={fieldLabel}>
                Phone Number
              </label>
              <Input
                id="pf-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingProfile} className="gap-2">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Change password ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-5 w-5 text-blue-500" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="pf-current" className={fieldLabel}>
                Current Password
              </label>
              <Input
                id="pf-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="pf-new" className={fieldLabel}>
                  New Password
                </label>
                <Input
                  id="pf-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pf-confirm" className={fieldLabel}>
                  Confirm New Password
                </label>
                <Input
                  id="pf-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Use at least 8 characters with an uppercase, lowercase, number, and special character.
            </p>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={changingPassword} className="gap-2">
                {changingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
