import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Shield, KeyRound, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import {
  profileUpdateSchema,
  ProfileUpdateFormData,
  changePasswordSchema,
  ChangePasswordFormData,
} from '../../utils/validators';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile Edit Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  // Change Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onUpdateProfile = async (data: ProfileUpdateFormData) => {
    try {
      await authService.updateProfile({
        name: data.name || user?.name || 'Student',
        avatarUrl: data.avatarUrl,
      });
      await refreshUser();
      toast.success('Profile details updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully');
      resetPasswordForm();
    } catch {
      toast.error('Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await authService.deleteAccount();
      toast.success('Your account has been deleted');
      await logout();
    } catch {
      toast.error('Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Student Profile & Settings</h1>
        <p className="text-sm text-gray-500">Manage your credentials, academic details, and security.</p>
      </div>

      {/* Account Status Card */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.slice(0, 2) || 'CC'
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
                  <Badge status={user?.status || 'ACTIVE'} size="sm" />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {user?.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    Role: {user?.role}
                  </span>
                  {user?.department && (
                    <span className="text-[11px] font-medium bg-red-50 text-primary px-2 py-0.5 rounded">
                      {user.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
              <p className="text-xs text-gray-400">Account Registered</p>
              <p className="text-xs font-semibold text-gray-700">{formatDate(user?.createdAt)}</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium sm:justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" /> College Domain Verified
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your display name and campus avatar representation</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <Input
              label="Display Name"
              placeholder="Full Name"
              leftIcon={<User className="w-4 h-4" />}
              error={profileErrors.name?.message}
              {...registerProfile('name')}
            />

            <Input
              label="Profile Photo URL (optional)"
              placeholder="https://images.unsplash.com/..."
              helperText="Paste an image link for your avatar"
              error={profileErrors.avatarUrl?.message}
              {...registerProfile('avatarUrl')}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" isLoading={isProfileSubmitting}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Security & Password */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your security password for college portal access</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<KeyRound className="w-4 h-4" />}
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<KeyRound className="w-4 h-4" />}
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<KeyRound className="w-4 h-4" />}
              error={passwordErrors.confirmNewPassword?.message}
              {...registerPassword('confirmNewPassword')}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="secondary" isLoading={isPasswordSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Danger Zone: Delete Account */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50/50">
          <div>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions related to your campus account</CardDescription>
          </div>
        </CardHeader>
        <CardBody className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Delete Account</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete your profile, poll votes, and submissions. This action cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Account
          </Button>
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        description="Are you sure you want to delete your student account?"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            This will permanently remove your user record from Campus Connect. Any pending event submissions or team postings will be closed.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
            >
              Yes, Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
