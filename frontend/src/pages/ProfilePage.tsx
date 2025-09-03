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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  // Form for profile information
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<TProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  // Form for password change
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
  } = useForm<TPasswordSchema>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: TProfileSchema) => {
    if (!user) return;
    try {
      const updatedUser = await updateUserProfile(user.id, data);
      setUser(updatedUser); // Update user in global state
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.message || "An error occurred.",
      });
    }
  };

  const onPasswordSubmit = async (data: TPasswordSchema) => {
    if (!user) return;
    try {
      await changeUserPassword(user.id, data);
      toast({
        title: "Success",
        description: "Your password has been changed.",
      });
      resetPasswordForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: error.response?.data?.message || "An error occurred.",
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...registerProfile("name")} />
                {profileErrors.name && (
                  <p className="text-sm text-red-500">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...registerProfile("email")} />
                {profileErrors.email && (
                  <p className="text-sm text-red-500">
                    {profileErrors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  placeholder="https://example.com/avatar.png"
                  {...registerProfile("avatarUrl")}
                />
                {profileErrors.avatarUrl && (
                  <p className="text-sm text-red-500">
                    {profileErrors.avatarUrl.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isProfileSubmitting}>
                {isProfileSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your security credentials.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPasswordSubmitting}>
                {isPasswordSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
