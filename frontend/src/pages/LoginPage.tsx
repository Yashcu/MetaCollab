import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TLoginSchema, loginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormInput from "@/components/FormInput";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { login as loginService } from "@/services/authService";
import { AxiosError } from "axios";

const LoginPage = () => {
  const methods = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const {
    formState: { isSubmitting },
  } = methods;

  const { login: loginStateAction } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Handles the form submission, calls the login service, and manages UI feedback.
   */
  const onSubmit = async (data: TLoginSchema) => {
    try {
      const { user, token } = await loginService(data);
      loginStateAction(user, token);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });
      navigate("/dashboard");
    } catch (error) {
      // --- Improved Error Handling ---
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof AxiosError && error.response) {
        // Use the specific error message from the backend if available
        errorMessage = error.response.data.message || "Invalid credentials.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login.</CardDescription>
        </CardHeader>
        {/* Use the FormProvider to pass down form context to nested inputs */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormInput
                name="email"
                label="Email"
                type="email"
                placeholder="abc@example.com"
              />
              <FormInput
                name="password"
                label="Password"
                type="password"
                placeholder="******"
              />
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link to="/signup" className="underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
};

export default LoginPage;
