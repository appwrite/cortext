import { getAccountClient } from "@/lib/appwrite";
import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthField } from "@/components/auth/auth-field";
import { queryClient } from "@/lib/react-query";

export const Route = createFileRoute("/_auth/sign-in")({
  component: RouteComponent,
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function RouteComponent() {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const account = getAccountClient();
  const { mutate: login, isPending } = useMutation({
    mutationFn: (data: LoginForm) =>
      account.createEmailPasswordSession(data.email, data.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      navigate({ to: search.redirect ?? "/" });
    },
  });

  const handleSubmit = (data: LoginForm, form: any) => {
    login(data, {
      onError: (error: any) => {
        console.error("Login error:", error);
        // Set error on the form so it displays in the UI
        if (error.message.toLowerCase().includes("email")) {
          form.setError("email", { message: error.message });
        } else if (error.message.toLowerCase().includes("password")) {
          form.setError("password", { message: error.message });
        } else {
          form.setError("root", { message: error.message });
        }
      },
    });
  };

  return (
    <AuthCard
      title="Sign in"
      description="Enter your email and password to access your account"
    >
      <AuthForm
        schema={loginSchema}
        defaultValues={{
          email: "",
          password: "",
        }}
        onSubmit={handleSubmit}
        submitText="Sign in"
        loadingText="Signing in..."
        isLoading={isPending}
      >
        {(form) => (
          <>
            <AuthField
              control={form.control}
              name="email"
              label="Email"
              placeholder="john@doe.com"
              type="email"
            />

            <AuthField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />
          </>
        )}
      </AuthForm>

      <div className="text-center text-sm text-muted-foreground mt-4 space-x-1">
        <div className="inline-block">Don't have an account? </div>
        <div className="inline-block">
          <Link
            to="/sign-up"
            search={search.redirect ? { redirect: search.redirect } : undefined}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
