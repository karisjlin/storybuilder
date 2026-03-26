import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateEmail, updatePassword, logout } from '../../services/auth';
import { getStories } from '../../services/stories';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Account() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [emailForm, setEmailForm] = useState({ email: user?.email || '', currentPassword: '' });
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [storyCount, setStoryCount] = useState<number | null>(null);

  useEffect(() => {
    getStories().then((stories) => setStoryCount(stories.length)).catch(() => {});
  }, []);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!emailForm.email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!emailForm.currentPassword) {
      setEmailError('Current password is required');
      return;
    }

    setEmailLoading(true);
    try {
      const data = await updateEmail(emailForm.email.trim(), emailForm.currentPassword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setEmailForm((f) => ({ ...f, currentPassword: '' }));
      setEmailSuccess('Email updated successfully');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update email';
      setEmailError(message);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Password updated successfully');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update password';
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="bg-surface-800 border-b border-surface-600 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-heading text-2xl font-black text-text-primary tracking-tight hover:opacity-80 transition-opacity"
          >
            Story<span className="text-accent-green">Forge</span>
          </button>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-text-muted font-body hidden sm:block">
                {user.username}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h2 className="font-heading text-3xl font-bold text-text-primary">Account</h2>
          <p className="text-text-muted font-body text-sm mt-1">{user?.username}</p>
          {storyCount !== null && (
            <p className="text-text-muted font-body text-sm mt-0.5">
              {storyCount} {storyCount === 1 ? 'story' : 'stories'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Email */}
          <div className="bg-surface-800 rounded-2xl p-6 border border-surface-600">
            <h3 className="font-heading text-lg font-bold text-text-primary mb-4">Change Email</h3>
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              {emailError && (
                <div className="px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm font-body">
                  {emailError}
                </div>
              )}
              {emailSuccess && (
                <div className="px-4 py-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm font-body">
                  {emailSuccess}
                </div>
              )}
              <Input
                label="New Email"
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
              <Input
                label="Current Password"
                type="password"
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <Button type="submit" loading={emailLoading}>
                  Update Email
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-surface-800 rounded-2xl p-6 border border-surface-600">
            <h3 className="font-heading text-lg font-bold text-text-primary mb-4">Change Password</h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              {passwordError && (
                <div className="px-4 py-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm font-body">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="px-4 py-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm font-body">
                  {passwordSuccess}
                </div>
              )}
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                autoComplete="new-password"
              />
              <div className="flex justify-end">
                <Button type="submit" loading={passwordLoading}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
