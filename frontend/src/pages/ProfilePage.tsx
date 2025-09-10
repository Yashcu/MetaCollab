// frontend/src/pages/ProfilePage.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TProfileSchema,
  profileSchema,
  TPasswordSchema,
  passwordSchema,
} from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { updateUserProfile, changeUserPassword } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsCard from "@/components/SettingsCard";
import { AxiosError } from "axios";

const ProfileForm = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const onSubmit = async (data: TProfileSchema) => {
    if (!user) return;
    try {
      const updatedUser = await updateUserProfile(user.id, data);
      setUser(updatedUser);
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.response?.data?.message,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsCard
        title="User Information"
        description="Update your personal details here."
        footer={
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              placeholder="https://example.com/avatar.png"
              {...register("avatarUrl")}
              aria-invalid={!!errors.avatarUrl}
            />
            {errors.avatarUrl && (
              <p className="text-sm text-red-500">{errors.avatarUrl.message}</p>
            )}
          </div>
        </div>
      </SettingsCard>
    </form>
  );
};

const PasswordForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TPasswordSchema>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: TPasswordSchema) => {
    if (!user) return;
    try {
      await changeUserPassword(user.id, data);
      toast({
        title: "Success",
        description: "Your password has been changed.",
      });
      reset();
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.response?.data?.message,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsCard
        title="Change Password"
        description="Update your security credentials."
        footer={
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register("currentPassword")}
              aria-invalid={!!errors.currentPassword}
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-500">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
              aria-invalid={!!errors.newPassword}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500">
                {errors.newPassword.message}
              </p>
            )}
          </div>
        </div>
      </SettingsCard>
    </form>
  );
};

const ProfilePage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
};

export default ProfilePage;
