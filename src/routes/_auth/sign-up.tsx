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
import { ID, AppwriteException } from "appwrite";
import { getAccountClient } from "@/lib/appwrite";
import { queryClient } from "@/lib/react-query";

export const Route = createFileRoute("/_auth/sign-up")({
  component: RouteComponent,
});

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpForm = z.infer<typeof signUpSchema>;

// Empty mutation function - to be implemented later
const createUserAccount = async (data: SignUpForm) => {
  const account = getAccountClient();

  try {
    await account.create(ID.unique(), data.email, data.password);
  } catch (error) {
    if (error instanceof AppwriteException) {
      throw new Error(error.message);
    }
    throw error;
  }

  try {
    await account.createEmailPasswordSession(data.email, data.password);
  } catch (error) {
    if (error instanceof AppwriteException) {
      console.error("Sign up error:", error.message);
      throw new Error(error.message);
    }
    throw error;
  }
};

function RouteComponent() {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  const { mutate: signUp, isPending } = useMutation({
    mutationFn: createUserAccount,
    onSuccess: () => {
      // TODO: Redirect to dashboard or login page
    },
  });

  const handleSubmit = (data: SignUpForm, form: any) => {
    signUp(data, {
      onError: (error: Error) => {
        console.error("Sign up error:", error);
        // Set error on the form so it displays in the UI
        if (error.message.toLowerCase().includes("email")) {
          form.setError("email", { message: error.message });
        } else if (error.message.toLowerCase().includes("password")) {
          form.setError("password", { message: error.message });
        } else {
          form.setError("root", { message: error.message });
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
        navigate({ to: search.redirect ?? "/" });
      },
    });
  };

  return (
    <AuthCard
      title="Sign up"
      description="Enter your details to create a new account"
    >
      <AuthForm
        schema={signUpSchema}
        defaultValues={{
          email: "",
          password: "",
        }}
        onSubmit={handleSubmit}
        submitText="Sign up"
        loadingText="Signing up..."
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
        <div className="inline-block">Already have an account? </div>
        <div className="inline-block">
          <Link
            to="/sign-in"
          search={search.redirect ? { redirect: search.redirect } : undefined}
          className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
